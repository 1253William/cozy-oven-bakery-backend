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

        // -------------------------------
        // 1. Validate input
        // -------------------------------
        if (!month || !year) {
            return res.status(400).json({
                success: false,
                message: "Month and year are required",
            });
        }

        // Convert "December" + "2025" → Date range
        const monthIndex = new Date(`${month} 1, ${year}`).getMonth();

        if (isNaN(monthIndex)) {
            return res.status(400).json({
                success: false,
                message: "Invalid month provided",
            });
        }

        const startDate = new Date(Number(year), monthIndex, 1);
        const endDate = new Date(Number(year), monthIndex + 1, 1);

        // -------------------------------
        // 2. Inventory Expenses
        // -------------------------------
        const expensesAgg = await InventoryModel.aggregate([
            {
                $match: {
                    inventoryMonth: month,
                    inventoryYear: year,
                },
            },
            {
                $group: {
                    _id: null,
                    totalExpenses: { $sum: "$totalCost" },
                },
            },
        ]);

        const totalExpenses = expensesAgg[0]?.totalExpenses || 0;

        // -------------------------------
        // 3. Revenue (PAID ORDERS ONLY)
        // -------------------------------
        const revenueAgg = await Order.aggregate([
            {
                $match: {
                    paymentStatus: "paid",
                    paidAt: {
                        $gte: startDate,
                        $lt: endDate,
                    },
                },
            },
            {
                $group: {
                    _id: null,
                    totalSales: { $sum: "$totalAmount" },
                },
            },
        ]);

        const totalRevenue = revenueAgg[0]?.totalSales || 0;

        // -------------------------------
        // 4. Profit & Margin
        // -------------------------------
        const profit = totalRevenue - totalExpenses;

        // const profitMargin =
        //     totalRevenue > 0
        //         ? Number(((profit / totalRevenue) * 100).toFixed(2))
        //         : 0;

        let profitMarginExplanation = null;
        let lossPerCedi = '0';
        if (totalRevenue > 0) {
            lossPerCedi = Math.abs(profit / totalRevenue).toFixed(2);

            profitMarginExplanation =
                profit < 0
                    ? `For every GHS 1 earned, the business lost approximately GHS ${lossPerCedi}.`
                    : `For every GHS 1 earned, the business made approximately GHS ${lossPerCedi}.`;
        }

        // -------------------------------
        // 5. Save / Update Report
        // -------------------------------
        const report = await Report.findOneAndUpdate(
            { month, year },
            {
                month,
                year,
                totalRevenue,
                totalExpenses,
                profit,
                profitMargin: lossPerCedi,
                profitMarginExplanation,
            },
            {
                new: true,
                upsert: true,
            }
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

// const monthMap: Record<string, string> = {
//     "01": "January",
//     "02": "February",
//     "03": "March",
//     "04": "April",
//     "05": "May",
//     "06": "June",
//     "07": "July",
//     "08": "August",
//     "09": "September",
//     "10": "October",
//     "11": "November",
//     "12": "December"
// };
// const normalizeMonth = (month: any): string =>
//     monthMap[String(month).padStart(2, "0")] || month;
//@route GET /api/v1/dashboard/admin/reports/export?month=12&year=2025&format=csv
//@desc Export monthly financial report
//@access Private (Admin only)
// export const exportMonthlyReport = async (req: AuthRequest, res: Response) => {
//     try {
//         const { month, year, format = "csv" } = req.query;
//
//         if (!month || !year) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Month and year are required"
//             });
//         }
//
//         const normalizedMonth = normalizeMonth(month);
//
//         const report = await Report.findOne({
//             month: normalizedMonth,
//             year: String(year)
//         });
//
//         if (!report) {
//             return res.status(404).json({
//                 success: false,
//                 message: "No report found for selected period"
//             });
//         }
//
//         const topProducts = await Order.aggregate([
//             {
//                 $match: {
//                     paymentStatus: "paid",
//                     orderMonth: normalizedMonth,
//                     orderYear: String(year)
//                 }
//             },
//             { $unwind: "$items" },
//             {
//                 $group: {
//                     _id: "$items.name",
//                     unitsSold: { $sum: "$items.quantity" },
//                     revenue: { $sum: "$items.total" }
//                 }
//             },
//             { $sort: { revenue: -1 } },
//             { $limit: 5 }
//         ]);
//
//         const topCustomers = await Order.aggregate([
//             {
//                 $match: {
//                     paymentStatus: "paid",
//                     orderMonth: normalizedMonth,
//                     orderYear: String(year)
//                 }
//             },
//             {
//                 $group: {
//                     _id: "$userId",
//                     totalOrders: { $sum: 1 },
//                     totalSpent: { $sum: "$totalAmount" }
//                 }
//             },
//             { $sort: { totalSpent: -1 } },
//             { $limit: 5 }
//         ]);
//
//         if (format !== "csv") {
//             return res.status(400).json({
//                 success: false,
//                 message: "Only CSV export is supported"
//             });
//         }
//
//         let csv = "";
//         csv += "MONTH,YEAR\n";
//         csv += `${normalizedMonth},${year}\n\n`;
//
//         csv += "FINANCIAL SUMMARY\n";
//         csv += "Total Revenue,Total Expenses,Profit,Profit Margin\n";
//         csv += `${report.totalRevenue},${report.totalExpenses},${report.profit},${report.profitMargin}%\n\n`;
//
//         csv += "TOP SELLING PRODUCTS\n";
//         csv += "Product Name,Units Sold,Revenue\n";
//         topProducts.forEach(p => {
//             csv += `${p._id},${p.unitsSold},${p.revenue}\n`;
//         });
//
//         csv += "\nTOP CUSTOMERS\n";
//         csv += "Customer ID,Total Orders,Total Spent\n";
//         topCustomers.forEach(c => {
//             csv += `${c._id},${c.totalOrders},${c.totalSpent}\n`;
//         });
//
//         res.setHeader("Content-Type", "text/csv");
//         res.setHeader(
//             "Content-Disposition",
//             `attachment; filename=monthly-report-${normalizedMonth}-${year}.csv`
//         );
//
//         res.status(200).send(csv);
//
//     } catch (error) {
//         console.error("Export error:", error);
//         res.status(500).json({
//             success: false,
//             message: "Failed to export report"
//         });
//     }
// };
