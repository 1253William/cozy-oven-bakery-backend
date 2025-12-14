import { Response } from "express";
import { AuthRequest } from "../../types/authRequest";
import UserModel from "../account/user.model"
import Order from "../orders/order.model";
import ProductModel from "../products/product.model";

//Customer Management Overview Stats: Total Customers, Active Customers, New customers this month, total revenue from customers
//@route GET /api/v1/dashboard/admin/customers/overview
//@desc Customer overview stats
//@access Private (Admin)
export const getCustomerOverview = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized: Authentication required" });
            return;
        }

        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

        const [totalCustomers, activeCustomers, newThisMonth, revenueAgg] =
            await Promise.all([
                UserModel.countDocuments({ role: "Customer", isAccountDeleted: false }),
                UserModel.countDocuments({ role: "Customer", isActive: true }),
                UserModel.countDocuments({
                    role: "Customer",
                    createdAt: { $gte: startOfMonth }
                }),
                Order.aggregate([
                    { $match: { paymentStatus: "paid" } },
                    { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } }
                ])
            ]);

        res.status(200).json({
            success: true,
            message: "Customer overview fetched successfully.",
            data: {
                totalCustomers,
                activeCustomers,
                newThisMonth,
                totalRevenue: revenueAgg[0]?.totalRevenue || 0
            }
        });
        return;

    } catch (error) {
        console.error("Customer overview error:", error);
        res.status(500).json({ success: false, message: "Failed to load overview" });
        return;
    }
};


//Fetch all customers for admin (Paginated customer list): customer full name, contact (email, number), orders made each customer,
//total spent each, status, date joined,
//@route GET /api/v1/dashboard/admin/customers
//@desc Fetch customers with orders & spending,filter by status, paginate, and search context (Search + filter)
//@access Private (Admin)
export const getAllCustomersAdmin = async (req: AuthRequest, res: Response) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const search = req.query.search as string;
        const status = req.query.status as string;

        const match: any = {
            role: "Customer",
            isAccountDeleted: false
        };

        if (status === "active") match.isActive = true;
        if (status === "inactive") match.isActive = false;

        if (search) {
            match.$or = [
                { fullName: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } }
            ];
        }

        const customers = await UserModel.aggregate([
            { $match: match },
            {
                $lookup: {
                    from: "orders",
                    localField: "_id",
                    foreignField: "userId",
                    pipeline: [{ $match: { paymentStatus: "paid" } }],
                    as: "orders"
                }
            },
            {
                $addFields: {
                    totalOrders: { $size: "$orders" },
                    totalSpent: { $sum: "$orders.totalAmount" }
                }
            },
            {
                $project: {
                    fullName: 1,
                    email: 1,
                    phoneNumber: 1,
                    isActive: 1,
                    createdAt: 1,
                    totalOrders: 1,
                    totalSpent: 1
                }
            },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit }
        ]);

        const total = await UserModel.countDocuments(match);

        res.status(200).json({
            success: true,
            message: "All customers fetched successfully.",
            data: customers,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            }
        });
        return;

    } catch (error) {
        console.error("Get customers error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch customers" });
        return;
    }
};


//View customer details (fetch customer by ID)
//@route GET /api/v1/dashboard/admin/customers/:id
//@desc View single customer
//@access Private (Admin)
export const getCustomerById = async (req: AuthRequest, res: Response) => {
    try {
        const customer = await UserModel.findById(req.params.id).select("-password");
        if (!customer) {
            return res.status(404).json({ success: false, message: "Customer not found" });
        }

        const orders = await Order.find({ userId: customer._id, paymentStatus: "paid" })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            message: "Customer fetched successfully.",
            data: {
                customer,
                orders
            }
        });
        return;

    } catch (error) {
        console.error("Get customer error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch customer" });
        return;
    }
};


//Activate / Deactivate customer
//@route DELETE /api/v1/dashboard/admin/customers/:id/deactivate
//@desc Toggle customer status
//@access Private (Admin)
export const toggleCustomerStatus = async (req: AuthRequest, res: Response) => {
    try {
        const customer = await UserModel.findById(req.params.id);
        console.log(customer);
        if (!customer) {
            return res.status(404).json({ success: false, message: "Customer not found" });
        }

        if(customer.isAccountDeleted){
            return res.status(400).json({ success: false, message: "Customer already deactivated" });
        }

        customer.isAccountDeleted = true
        await customer.save();

        res.status(200).json({
            success: true,
            message: "Customer deactivated"
        });
        return;

    } catch (error) {
        console.error("Toggle customer error:", error);
        res.status(500).json({ success: false, message: "Failed to update status" });
        return;
    }
};

