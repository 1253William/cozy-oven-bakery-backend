import express from 'express';
import { authMiddleware } from "../../middlewares/authentication.middleware";
import { authorizedRoles } from "../../middlewares/roles.middleware";
import {
    // exportMonthlyReport,
    monthlyFinanceSummary, salesByCategory, topCustomers, topSellingProducts

} from "./reports.controller";


const router = express.Router();


/**
 * @swagger
 * /api/v1/dashboard/admin/reports/finance-summary?month=January&year=2025:
 *   get:
 *     summary: Get monthly profit and expense summary
 *     tags:
 *       - Reports & Analytics (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         required: true
 *         example: "January"
 *       - in: query
 *         name: year
 *         required: true
 *         example: "2025"
 *     responses:
 *       200:
 *         description: Monthly finance summary fetched
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 month: "January"
 *                 year: 2025
 *                 totalRevenue: 15000
 *                 totalExpenses: 9500
 *                 profit: 5500
 *                 profitMargin: "36.67%"
 */
//@route GET /api/v1/admin/reports/finance-summary?month=January&year=2025
//@desc Monthly finance summary fetched
//@access Private (Admin only)
router.get('/admin/reports/finance-summary', authMiddleware, authorizedRoles("Admin"), monthlyFinanceSummary );

/**
 * @swagger
 * /api/v1/dashboard/admin/reports/sales-by-category:
 *   get:
 *     tags:
 *       - Reports & Analytics (Admin)
 *     summary: Fetch sales by category
 *     description: |
 *       Returns revenue grouped by product category.
 *       Also calculates the percentage contribution of each category
 *       relative to total paid sales.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Sales by category fetched successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Sales by category fetched successfully.
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       category:
 *                         type: string
 *                         example: Cakes
 *                       revenue:
 *                         type: number
 *                         example: 12450.75
 *                       percentage:
 *                         type: number
 *                         example: 42.5
 *       401:
 *         description: Unauthorized – Admin access required.
 *       403:
 *         description: Forbidden – Insufficient permissions.
 *       500:
 *         description: Failed to calculate sales by category.
 */
//@route GET /api/v1/dashboard/admin/reports/sales-by-category
//desc Fetch sales by category
//@access Private (Admin only)
router.get('/admin/reports/sales-by-category', authMiddleware, authorizedRoles("Admin"), salesByCategory );

/**
 * @swagger
 * /api/v1/dashboard/admin/reports/top-selling-products:
 *   get:
 *     tags:
 *       - Reports & Analytics (Admin)
 *     summary: Fetch top selling products
 *     description: |
 *       Returns the top selling products ranked by total revenue.
 *       Only paid orders are considered.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Top selling products fetched successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Top selling products fetched successfully.
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         description: Product ID
 *                       name:
 *                         type: string
 *                         example: Chocolate Cake
 *                       unitsSold:
 *                         type: number
 *                         example: 120
 *                       revenue:
 *                         type: number
 *                         example: 5400.00
 *       401:
 *         description: Unauthorized – Admin access required.
 *       403:
 *         description: Forbidden – Insufficient permissions.
 *       500:
 *         description: Failed to calculate top selling products.
 */
//@route GET /api/v1/dashboard/admin/reports/top-selling-products
//desc Fetch top selling products
//@access Private (Admin only)
router.get('/admin/reports/top-selling-products', authMiddleware, authorizedRoles("Admin"), topSellingProducts );

/**
 * @swagger
 * /api/v1/dashboard/admin/reports/top-customers:
 *   get:
 *     tags:
 *       - Reports & Analytics (Admin)
 *     summary: Fetch top customers by total spending
 *     description: |
 *       Returns a paginated list of customers ranked by total amount spent.
 *       Only paid orders are included.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *           example: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           example: 5
 *         description: Number of customers per page
 *     responses:
 *       200:
 *         description: Top customers fetched successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Top customers fetched successfully.
 *                 meta:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: number
 *                       example: 1
 *                     limit:
 *                       type: number
 *                       example: 5
 *                     total:
 *                       type: number
 *                       example: 42
 *                     totalPages:
 *                       type: number
 *                       example: 9
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       rank:
 *                         type: number
 *                         example: 1
 *                       userId:
 *                         type: string
 *                       fullName:
 *                         type: string
 *                         example: Jane Smith
 *                       email:
 *                         type: string
 *                         example: jane@email.com
 *                       totalOrders:
 *                         type: number
 *                         example: 18
 *                       totalSpent:
 *                         type: number
 *                         example: 3820.5
 *       401:
 *         description: Unauthorized – Admin access required.
 *       403:
 *         description: Forbidden – Insufficient permissions.
 *       500:
 *         description: Failed to calculate top customers.
 */
//@route GET /api/v1/dashboard/admin/reports/top-customers?page=1&limit=5
//desc Fetch top customers
//@access Private (Admin only)
router.get('/admin/reports/top-customers', authMiddleware, authorizedRoles("Admin"), topCustomers );

// /**
//  * @swagger
//  * /api/v1/dashboard/admin/reports/export?month=12&year=2025&format=csv:
//  *   get:
//  *     summary: Export monthly business report
//  *     description: Export financial and analytics report for a given month and year.
//  *     tags:
//  *       - Reports & Analytics
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: query
//  *         name: month
//  *         required: true
//  *         schema:
//  *           type: string
//  *           example: "08"
//  *       - in: query
//  *         name: year
//  *         required: true
//  *         schema:
//  *           type: string
//  *           example: "2025"
//  *       - in: query
//  *         name: format
//  *         required: false
//  *         schema:
//  *           type: string
//  *           enum: [csv]
//  *     responses:
//  *       200:
//  *         description: Report exported successfully
//  *       404:
//  *         description: Report not found
//  *       500:
//  *         description: Server error
//  */
//@route GET /api/v1/dashboard/admin/reports/export?month=12&year=2025&format=csv
//@desc Export monthly report
//@access Private (Admin only)
// router.get('/admin/reports/export', authMiddleware, authorizedRoles("Admin"),exportMonthlyReport);


export default router;