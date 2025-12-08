import { Response } from "express";
import { AuthRequest } from "../../types/authRequest";
import Order from "../orders/order.model";

interface DashboardResponse {
    dailyStats: {
        sales: number;
        orders: number;
    };
    monthlyStats: {
        sales: number;
        orders: number;
    };
    popularProductThisWeek: {
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

// Get start and end of current week (Sunday to Saturday)
const now = new Date();
const startOfWeek = new Date(now);
startOfWeek.setDate(now.getDate() - now.getDay()); // Set to Sunday
startOfWeek.setHours(0, 0, 0, 0);

const endOfWeek = new Date(now);
endOfWeek.setDate(now.getDate() + (6 - now.getDay())); // Set to Saturday
endOfWeek.setHours(23, 59, 59, 999);

// Get the single most popular product for current week
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

        const response: DashboardResponse = {
            dailyStats: {
                sales: dailySales[0]?.totalSales || 0,
                orders: dailySales[0]?.orderCount || 0
            },
            monthlyStats: {
                sales: monthlySales[0]?.totalSales || 0,
                orders: monthlySales[0]?.orderCount || 0
            },
            popularProductThisWeek: popularProduct[0] ? {
                name: popularProduct[0]._id.name,
                productId: popularProduct[0]._id.productId,
                quantitySold: popularProduct[0].totalQuantity,
                revenue: popularProduct[0].totalRevenue,
                productThumbnail: popularProduct[0]._id.productThumbnail
            } : null
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


//@route GET /api/v1/dashboard/admin/products?popular=true
//desc Fetch all popular products (i.e. most sold) and paginate 5 products per page
//@access Private (Admin only)



//@route GET /api/v1/dashboard/overview/sales?popular=true
//desc Chart visualization data goes here: Showing daily data, monthly data, and popular bread
//@access Private (Admin only)