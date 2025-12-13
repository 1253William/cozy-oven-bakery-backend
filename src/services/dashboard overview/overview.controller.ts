import { Response } from "express";
import { AuthRequest } from "../../types/authRequest";
import Order from "../orders/order.model";
import ProductModel from "../products/product.model";

interface DashboardResponse {
    dailyStats: {
        sales: number;
        orders: number;
    };
    monthlyStats: {
        sales: number;
        orders: number;
    };
    bestSellerThisWeek: {
        name: string;
        productId: string;
        quantitySold: number;
        revenue: number;
        productThumbnail: string;
    } | null;
    bestSellerThisMonth: {
        name: string;
        productId: string;
        quantitySold: number;
        revenue: number;
        productThumbnail: string;
    } | null;
}

//@route GET /api/v1/dashboard/overview/
//desc Get data on daily sales, monthly sales and popular bread + number sold,
//@access Private (Admin only)
export const DashboardStats = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized: Authentication required" });
            return;
        }

        // Get today's date (start and end)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Get first day of current month
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        // Daily Sales Aggregation
        const dailySales = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: today, $lt: tomorrow },
                    paymentStatus: "paid"
                }
            },
            {
                $group: {
                    _id: null,
                    totalSales: { $sum: "$totalAmount" },
                    orderCount: { $sum: 1 }
                }
            }
        ]);

        // Monthly Sales Aggregation
        const monthlySales = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: firstDayOfMonth },
                    paymentStatus: "paid"
                }
            },
            {
                $group: {
                    _id: null,
                    totalSales: { $sum: "$totalAmount" },
                    orderCount: { $sum: 1 }
                }
            }
        ]);

        //Get start and end of current week (Sunday to Saturday)
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay()); // Set to Sunday
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(now);
        endOfWeek.setDate(now.getDate() + (6 - now.getDay())); // Set to Saturday
        endOfWeek.setHours(23, 59, 59, 999);


        //Get start and end of current month
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        startOfMonth.setHours(0, 0, 0, 0);

        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);

        //Get the single most popular product for current week
        const popularProduct = await Order.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: startOfWeek,
                        $lte: endOfWeek
                    },
                    paymentStatus: "paid"
                }
            },
            {
                $unwind: "$items"
            },
            {
                $group: {
                    _id: {
                        productId: "$items.productId",
                        name: "$items.name",
                        productThumbnail: "$items.thumbnail"
                    },
                    totalQuantity: { $sum: "$items.quantity" },
                    totalRevenue: { $sum: "$items.total" }
                }
            },
            {
                $sort: { totalQuantity: -1 }
            },
            {
                $limit: 1
            }
        ]);

        // Get the single most popular product for current month
        const popularProductThisMonth = await Order.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: startOfMonth,
                        $lte: endOfMonth
                    },
                    paymentStatus: "paid"
                }
            },
            {
                $unwind: "$items"
            },
            {
                $group: {
                    _id: {
                        productId: "$items.productId",
                        name: "$items.name",
                        productThumbnail: "$items.thumbnail"
                    },
                    totalQuantity: { $sum: "$items.quantity" },
                    totalRevenue: { $sum: "$items.total" }
                }
            },
            {
                $sort: { totalQuantity: -1 }
            },
            {
                $limit: 1
            }
        ]);

        const response: DashboardResponse = {
            dailyStats: {
                sales: dailySales[0]?.totalSales || 0,
                orders: dailySales[0]?.orderCount || 0
            },
            monthlyStats: {
                sales: monthlySales[0]?.totalSales || 0,
                orders: monthlySales[0]?.orderCount || 0
            },
            bestSellerThisWeek: popularProduct[0] ? {
                name: popularProduct[0]._id.name,
                productId: popularProduct[0]._id.productId,
                quantitySold: popularProduct[0].totalQuantity,
                revenue: popularProduct[0].totalRevenue,
                productThumbnail: popularProduct[0]._id.productThumbnail
            } : null,
            bestSellerThisMonth: popularProductThisMonth[0]
                ? {
                    name: popularProductThisMonth[0]._id.name,
                    productId: popularProductThisMonth[0]._id.productId,
                    quantitySold: popularProductThisMonth[0].totalQuantity,
                    revenue: popularProductThisMonth[0].totalRevenue,
                    productThumbnail: popularProductThisMonth[0]._id.productThumbnail
                }
                : null
        };

        res.status(200).json({
            success: true,
            message: "Dashboard stats fetched successfully.",
            data: response
        });
        return;

    } catch (error: any) {
        console.log("Dashboard stats Error:", error.response?.data || error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
        return;
    }
};


//@route GET /api/v1/dashboard/admin/products?popular=true&page=1&limit=5
//desc Fetch all popular products (i.e. most sold) and paginate 5 products per page
//@access Private (Admin only)
export const getPopularProducts = async (req: AuthRequest, res: Response): Promise<void>=> {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 5;
        const skip = (page - 1) * limit;

        //Aggregate most sold items
        const popularAggregation = await Order.aggregate([
            { $match: { paymentStatus: "paid" } },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.productId",
                    totalSold: { $sum: "$items.quantity" }
                }
            },
            { $sort: { totalSold: -1 } },
            { $skip: skip },
            { $limit: limit }
        ]);

        const productIds = popularAggregation.map(p => p._id);

        //Fetch product details
        const products = await ProductModel.find({
            _id: { $in: productIds }
        })
            .select("productName productThumbnail price productStatus")
            .lean();

        //Merge sales data
        const result = popularAggregation.map(p => {
            const product = products.find(pr => String(pr._id) === String(p._id));
            return {
                productId: p._id,
                productName: product?.productName,
                thumbnail: product?.productThumbnail,
                price: product?.price,
                totalSold: p.totalSold,
                status: product?.productStatus
            };
        });

        res.status(200).json({
            success: true,
            message: "Popular products fetched successfully.",
            page,
            limit,
            data: result
        });
        return;

    } catch (error) {
        console.error("Popular products error:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error: Failed to fetch popular products"
        });
        return;
    }
};


//@route GET /api/v1/dashboard/overview/sales?daily=true
//desc Chart visualization data goes here: Showing daily data, monthly data, and popular bread
//@access Private (Admin only)
export const getSalesOverview = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { daily, monthly } = req.query;

        let salesData;

        if (daily === "true") {
            salesData = await Order.aggregate([
                { $match: { paymentStatus: "paid" } },
                {
                    $group: {
                        _id: {
                            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                        },
                        totalRevenue: { $sum: "$totalAmount" },
                        orders: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]);
        }

        if (monthly === "true") {
            salesData = await Order.aggregate([
                { $match: { paymentStatus: "paid" } },
                {
                    $group: {
                        _id: {
                            $dateToString: { format: "%Y-%m", date: "$createdAt" }
                        },
                        totalRevenue: { $sum: "$totalAmount" },
                        orders: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]);
        }

        res.status(200).json({
            success: true,
            mode: daily ? "daily" : "monthly",
            data: salesData
        });

    } catch (error) {
        console.error("Sales overview error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch sales overview"
        });
    }
};
