import express from "express";
import { authMiddleware } from "../../middlewares/authentication.middleware";
import { authorizedRoles } from "../../middlewares/roles.middleware";
import {
    getCustomerOverview,
    getAllCustomersAdmin,
    getCustomerById,
    toggleCustomerStatus,
} from "./customers.controller";

const router = express.Router();

/**
 * @swagger
 * /api/v1/dashboard/admin/customers/overview:
 *   get:
 *     tags:
 *       - Admin (Customer Management)
 *     summary: Get customer overview statistics
 *     description: |
 *       Returns high-level customer statistics for the admin dashboard including:
 *       - Total customers
 *       - Active customers
 *       - New customers this month
 *       - Total revenue from paid orders
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Customer overview statistics fetched successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalCustomers:
 *                       type: number
 *                       example: 1240
 *                     activeCustomers:
 *                       type: number
 *                       example: 982
 *                     newThisMonth:
 *                       type: number
 *                       example: 76
 *                     totalRevenue:
 *                       type: number
 *                       example: 45820.75
 *       401:
 *         description: Unauthorized – Admin authentication required.
 *       500:
 *         description: Internal Server Error.
 */
//@route GET /api/v1/dashboard/admin/customers/overview
//@desc Customer overview stats
//@access Private (Admin)
router.get("/admin/customers/overview", authMiddleware,authorizedRoles("Admin"), getCustomerOverview);

/**
 * @swagger
 * /api/v1/dashboard/admin/customers:
 *   get:
 *     tags:
 *       - Admin (Customer Management)
 *     summary: Fetch all customers (admin view)
 *     description: |
 *       Returns a paginated list of customers with aggregated data including:
 *       - Total orders
 *       - Total amount spent
 *       - Account status
 *       - Join date
 *       Supports search and status filtering.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *           example: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           example: 10
 *         description: Number of records per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           example: william
 *         description: Search by customer name or email
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: Filter customers by active status
 *     responses:
 *       200:
 *         description: Customers fetched successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       fullName:
 *                         type: string
 *                         example: William Ofosu Parwar
 *                       email:
 *                         type: string
 *                         example: william@example.com
 *                       phoneNumber:
 *                         type: string
 *                         example: "0558288424"
 *                       isActive:
 *                         type: boolean
 *                         example: true
 *                       totalOrders:
 *                         type: number
 *                         example: 12
 *                       totalSpent:
 *                         type: number
 *                         example: 1340.5
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                       example: 240
 *                     page:
 *                       type: number
 *                       example: 1
 *                     pages:
 *                       type: number
 *                       example: 24
 *       401:
 *         description: Unauthorized – Admin authentication required.
 *       500:
 *         description: Internal Server Error.
 */
//@route GET /api/v1/dashboard/admin/customers
//@desc Fetch customers with orders & spending,filter by status, paginate, and search context (Search + filter)
//@access Private (Admin)
router.get("/admin/customers", authMiddleware,authorizedRoles("Admin"), getAllCustomersAdmin);

/**
 * @swagger
 * /api/v1/dashboard/admin/customers/{id}:
 *   get:
 *     tags:
 *       - Admin (Customer Management)
 *     summary: View single customer details
 *     description: |
 *       Fetch detailed information about a specific customer including
 *       their profile data and paid order history.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer details fetched successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     customer:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         fullName:
 *                           type: string
 *                         email:
 *                           type: string
 *                         phoneNumber:
 *                           type: string
 *                         isActive:
 *                           type: boolean
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                     orders:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           totalAmount:
 *                             type: number
 *                           paymentStatus:
 *                             type: string
 *                             example: paid
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *       404:
 *         description: Customer not found.
 *       401:
 *         description: Unauthorized – Admin authentication required.
 *       500:
 *         description: Internal Server Error.
 */
//@route GET /api/v1/dashboard/admin/customers/:id
//@desc View single customer
//@access Private (Admin)
router.get("/admin/customers/:id", authMiddleware, authorizedRoles("Admin"), getCustomerById);

/**
 * @swagger
 * /api/v1/dashboard/admin/customers/{id}/deactivate:
 *   delete:
 *     tags:
 *       - Admin (Customer Management)
 *     summary: Deactivate a customer
 *     description: |
 *       Toggles a customer's account status.
 *       If the customer is active, they will be deactivated.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer deactivated successfully.
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
 *                   example: Customer deactivated
 *       404:
 *         description: Customer not found.
 *       401:
 *         description: Unauthorized – Admin authentication required.
 *       500:
 *         description: Internal Server Error.
 */
//@route DELETE /api/v1/dashboard/admin/customers/:id/deactivate
//@desc Deactivate customer status
//@access Private (Admin)
router.delete("/admin/customers/:id/deactivate", authMiddleware, authorizedRoles("Admin"), toggleCustomerStatus);

export default router;
