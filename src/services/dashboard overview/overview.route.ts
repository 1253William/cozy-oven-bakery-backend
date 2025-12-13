import express from "express";
import { authMiddleware } from "../../middlewares/authentication.middleware";
import { authorizedRoles } from "../../middlewares/roles.middleware";
import {
    DashboardStats,
    getPopularProducts,
    getSalesOverview,
} from "./overview.controller";

const router = express.Router();

//Admin Dashboard Overview routes

/**
 * @swagger
 * /api/v1/dashboard/overview:
 *   get:
 *     tags:
 *       - Dashboard (Overview)
 *     summary: Get dashboard sales overview and weekly popular product
 *     description: Returns daily sales, monthly sales, and the best seller product for the current week and month. Admin access only.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics fetched successfully
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
 *                   example: "Dashboard stats fetched successfully."
 *                 data:
 *                   type: object
 *                   properties:
 *                     dailyStats:
 *                       type: object
 *                       properties:
 *                         sales:
 *                           type: number
 *                           example: 1240.50
 *                         orders:
 *                           type: number
 *                           example: 14
 *                     monthlyStats:
 *                       type: object
 *                       properties:
 *                         sales:
 *                           type: number
 *                           example: 21540.75
 *                         orders:
 *                           type: number
 *                           example: 216
 *                     bestSellerThisWeek:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         name:
 *                           type: string
 *                           example: "Chocolate Bread"
 *                         productId:
 *                           type: string
 *                           example: "65fa8129bc3f41a8d9f12345"
 *                         quantitySold:
 *                           type: number
 *                           example: 48
 *                         revenue:
 *                           type: number
 *                           example: 960.00
 *                         productThumbnail:
 *                           type: string
 *                           example: "https://cdn.cozyoven.com/products/choco-bread.png"
 *                     bestSellerThisMonth:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                        name:
 *                         type: string
 *                         example: "Vanilla Bread"
 *                        productId:
 *                           type: string
 *                           example: "56379294839129f12e3e8"
 *                        quantitySold:
 *                           type: number
 *                           example: 12
 *                        productThumbnail:
 *                           type: string
 *                           example: "https://cdn.cozyoven.com/products/vanilla-bread.png"
 *       401:
 *         description: Unauthorized – Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Unauthorized: Authentication required"
 *       403:
 *         description: Forbidden – Admin access only
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Internal Server Error"
 */
//@route GET /api/v1/dashboard/overview/
//desc Get data on daily sales, monthly sales and popular bread + number sold,
//@access Private (Admin only)
router.get("/overview", authMiddleware, authorizedRoles("Admin"), DashboardStats);

/**
 * @swagger
 * /api/v1/dashboard/admin/products?popular=true&page=1&limit=5:
 *   get:
 *     tags:
 *       - Dashboard (Overview)
 *     summary: Get most popular products
 *     description: Returns best-selling products based on paid orders
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: popular
 *         required: true
 *         schema:
 *           type: boolean
 *           example: true
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 5
 *     responses:
 *       200:
 *         description: Popular products fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
//@route GET /api/v1/dashboard/admin/products?popular=true&page=1&limit=5
//desc Fetch all popular products (i.e. most sold) and paginate 5 products per page
//@access Private (Admin only)
router.get("/admin/products", authMiddleware, authorizedRoles("Admin"), getPopularProducts);

/**
 * @swagger
 * /api/v1/dashboard/overview/sales?monthly=true:
 *   get:
 *     tags:
 *       - Dashboard (Overview)
 *     summary: Get sales overview
 *     description: Returns daily or monthly aggregated sales
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: daily
 *         schema:
 *           type: boolean
 *           example: true
 *       - in: query
 *         name: monthly
 *         schema:
 *           type: boolean
 *           example: true
 *     responses:
 *       200:
 *         description: Sales overview fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
//@route GET /api/v1/dashboard/overview/sales?daily=true
//desc Chart visualization data goes here: Showing daily data, monthly data, and popular bread
//@access Private (Admin only)
router.get("/overview/sales", authMiddleware, authorizedRoles("Admin"), getSalesOverview);



export default router;