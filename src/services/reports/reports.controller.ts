import { Response } from 'express';
import { AuthRequest } from "../../types/authRequest";
import InventoryModel from '../inventory/inventory.model';
import Order from '../orders/order.model';
import Report from '../reports/reports.model';

//////////////Reports & Analytics
//Sales → comes from Order, Expenses → comes from Inventory purchases
//Profit → Sales - Expenses, Reports → saved monthly snapshots
//Outcome: Revenue, Expenses,Profit, Top products, Top customers, Sales by category



//@route GET /api/v1/dashboard/admin/reports/finance-summary
//@desc Fetch monthly finance summary for a given month and year
//@access Private (Admin only)
export const monthlyFinanceSummary = async (req: AuthRequest, res: Response) => {
    try {
        const { month, year } = req.query;

        if (!month || !year) {
            res.status(400).json({
                success: false,
                message: "Month and year are required"
            });
            return;
        }

        //Inventory expenses
        const expenses = await InventoryModel.aggregate([
            { $match: { inventoryMonth: month, inventoryYear: year } },
            { $group: { _id: null, totalExpenses: { $sum: "$totalCost" } } },
        ]);

        //Sales revenue
        const revenue = await Order.aggregate([
            {
                $match: {
                    paymentStatus: "paid",
                    orderMonth: month,
                    orderYear: year,
                },
            },
            { $group: { _id: null, totalSales: { $sum: "$totalAmount" } } },
        ]);

        const totalExpenses = expenses[0]?.totalExpenses || 0;
        const totalSales = revenue[0]?.totalSales || 0;

        const profit = totalSales - totalExpenses;
        const profitMargin = totalSales
            ? ((profit / totalSales) * 100).toFixed(2)
            : 0;

        const report = await Report.findOneAndUpdate(
            { month, year },
            {
                month,
                year,
                totalSales,
                totalExpenses,
                profit,
                profitMargin
            },
            { new: true, upsert: true }
        );

        res.status(200).json({
            success: true,
            message: "Monthly finance summary fetched successfully.",
            data: report
        });
        return;

    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to calculate finance summary" });
        return;
    }
};


//@route GET /api/v1/dashboard/admin/reports/sales-by-category
//desc Fetch sales by category with revenue percentage
//@access Private (Admin only)
export const salesByCategory = async (req: AuthRequest, res: Response) => {
    try {
        const data = await Order.aggregate([
            { $match: { paymentStatus: "paid" } },

            { $unwind: "$items" },

            {
                $lookup: {
                    from: "products",
                    localField: "items.productId",
                    foreignField: "_id",
                    as: "product"
                }
            },

            { $unwind: "$product" },

            //Revenue per category
            {
                $group: {
                    _id: "$product.productCategory",
                    revenue: { $sum: "$items.total" }
                }
            },

            //Get total revenue (for percentage calculation)
            {
                $group: {
                    _id: null,
                    categories: { $push: "$$ROOT" },
                    totalRevenue: { $sum: "$revenue" }
                }
            },

            //Calculate percentage per category
            {
                $unwind: "$categories"
            },
            {
                $project: {
                    _id: 0,
                    category: "$categories._id",
                    revenue: "$categories.revenue",
                    percentage: {
                        $round: [
                            {
                                $multiply: [
                                    { $divide: ["$categories.revenue", "$totalRevenue"] },
                                    100
                                ]
                            },
                            2
                        ]
                    }
                }
            },

            //Sort for nicer charts
            { $sort: { revenue: -1 } }
        ]);

        res.status(200).json({
            success: true,
            message: "Sales by category fetched successfully.",
            data
        });
        return;

    } catch (error) {
        console.error("Sales by category error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to calculate sales by category"
        });
        return;
    }
};



//@route GET /api/v1/dashboard/admin/reports/top-selling-products
//desc Fetch top selling products
//@access Private (Admin only)
export const topSellingProducts = async (_: AuthRequest, res: Response) => {
    try {
        const products = await Order.aggregate([
            { $match: { paymentStatus: "paid" } },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.productId",
                    name: { $first: "$items.name" },
                    unitsSold: { $sum: "$items.quantity" },
                    revenue: { $sum: "$items.total" }
                }
            },
            { $sort: { revenue: -1 } },
            { $limit: 5 }
        ]);

        res.status(200).json({
            success: true,
            message: "Top selling products fetched successfully.",
            data: products
        });
        return;

    }catch (error) {
        res.status(500).json({ success: false, message: "Failed to calculate top selling products" });
        return;
    }
};


//@route GET /api/v1/dashboard/admin/reports/top-customers
//desc Fetch top customers by total spent
//@access Private (Admin only)
export const topCustomers = async (req: AuthRequest, res: Response) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 5;
        const skip = (page - 1) * limit;

        const customers = await Order.aggregate([
            { $match: { paymentStatus: "paid" } },

            //Group orders per customer
            {
                $group: {
                    _id: "$userId",
                    totalOrders: { $sum: 1 },
                    totalSpent: { $sum: "$totalAmount" }
                }
            },

            //Sort by highest spenders
            { $sort: { totalSpent: -1 } },

            //Lookup user details
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "user"
                }
            },
            { $unwind: "$user" },

            //Shape response
            {
                $project: {
                    _id: 0,
                    userId: "$_id",
                    fullName: "$user.fullName",
                    email: "$user.email",
                    totalOrders: 1,
                    totalSpent: 1
                }
            },

            //Pagination
            { $skip: skip },
            { $limit: limit }
        ]);

        //Total count (for frontend pagination)
        const totalCustomers = await Order.aggregate([
            { $match: { paymentStatus: "paid" } },
            { $group: { _id: "$userId" } },
            { $count: "count" }
        ]);

        const total = totalCustomers[0]?.count || 0;

        //Add rank (based on pagination)
        const rankedCustomers = customers.map((customer, index) => ({
            rank: skip + index + 1,
            ...customer
        }));

        res.status(200).json({
            success: true,
            message: "Top customers fetched successfully.",
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            },
            data: rankedCustomers
        });
        return;

    } catch (error) {
        console.error("Top customers error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to calculate top customers"
        });
        return;
    }
};
