import { Response } from 'express';
import { AuthRequest } from "../../types/authRequest";
import InventoryModel from '../inventory/inventory.model';
import Order from '../orders/order.model';

//////////////Reports & Analytics



//@route POST /api/v1/dashboard/admin/reports/monthly-finance-summary
//@desc Fetch monthly finance summary for a given month and year
//@access Private (Admin only)
export const monthlyFinanceSummary = async (req: AuthRequest, res: Response) => {
    try {
        const { month, year } = req.query;

        // Inventory expenses
        const expenses = await InventoryModel.aggregate([
            { $match: { inventoryMonth: month, inventoryYear: year } },
            { $group: { _id: null, totalExpenses: { $sum: "$totalCost" } } },
        ]);

        // Sales revenue
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

        res.status(200).json({
            success: true,
            data: {
                month,
                year,
                totalSales,
                totalExpenses,
                profit,
                profitMargin: `${profitMargin}%`,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to calculate finance summary" });
    }
};
