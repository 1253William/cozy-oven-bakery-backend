import express from "express";
import { authMiddleware } from "../../middlewares/authentication.middleware";
import { authorizedRoles } from "../../middlewares/roles.middleware";
import {
    checkOut,
    initiatePayment,
    hubtelWebhook,
    getMyOrders,
    getReceipt,
    getAllOrdersAdmin,
    updateOrderStatus,
    deleteOrder,
} from "./order.controller";

const router = express.Router();



//Customer Order routes
/**
 * @swagger
 * /api/v1/store/customer/orders/checkout:
 *   post:
 *     summary: Create order and checkout
 *     description: Creates a new order, verifies product prices, computes totals, and locks the order for payment. Customer access only.
 *     tags:
 *       - Orders (Customer)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *               - deliveryAddress
 *               - contactNumber
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                     unitPrice:
 *                       type: number
 *               deliveryFee:
 *                 type: number
 *                 example: 10
 *               deliveryAddress:
 *                 type: string
 *                 example: Dansoman Roundabout
 *               contactNumber:
 *                 type: string
 *                 example: 0558288424
 *               paymentMethod:
 *                 type: string
 *                 example: hubtel
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Invalid order data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
//@route POST /api/v1/store/customer/orders/checkout
//@desc Customer place order and check out.  Checkout: create order and lock totals.
//Frontend sends items + totals. Backend verifies product prices for a subset or all items,
//recomputes totals server-side and rejects if mismatch.
//@access Private (Customer only)
router.post("/store/customer/orders/checkout", authMiddleware,authorizedRoles("Customer"), checkOut)

/**
 * @swagger
 * /api/v1/store/customer/orders/{orderId}/initiate-payment:
 *   post:
 *     summary: Initialize payment for an order
 *     description: Initializes payment using the locked order total. Customer access only.
 *     tags:
 *       - Orders (Customer)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID to initiate payment for
 *     responses:
 *       200:
 *         description: Payment initialized successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 *       500:
 *         description: Payment initialization failed
 */
//@route POST /api/v1/store/customer/orders/:orderId/initiate-payment
//@desc Customer initiate dashboard overview
//@access Private (Customer only)
router.post("/store/customer/orders/:orderId/initiate-payment", authMiddleware,authorizedRoles("Customer"), initiatePayment);

//Webhook
//@route POST /api/v1/webhooks/hubtel
//@desc Hubtel webhook listener
//@access Public (Hubtel Webhook)
router.post("/webhooks/hubtel", hubtelWebhook);

/**
 * @swagger
 * /api/v1/store/customer/order-history:
 *   get:
 *     summary: Fetch customer order history
 *     description: Returns all orders belonging to the authenticated customer.
 *     tags:
 *       - Orders (Customer)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Orders fetched successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to fetch orders
 */
//@route GET /api/v1/store/customer/order-history
//@desc Fetch customer orders (paginated, UI-friendly)
//@access Private (Customer only)
router.get("/store/customer/order-history", authMiddleware,authorizedRoles("Customer"), getMyOrders);


router.get("/store/customer/orders/:orderId/receipt", authMiddleware, authorizedRoles("Customer"), getReceipt);




//Admin Order routes
/**
 * @swagger
 * /api/v1/dashboard/admin/orders:
 *   get:
 *     summary: Fetch all orders (Admin)
 *     description: Fetches all customer orders with pagination and statistics.
 *     tags:
 *       - Orders (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Orders fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin only)
 *       500:
 *         description: Failed to fetch orders
 */
//@route GET /api/v1/dashboard/admin/orders
//@desc Fetch customer orders to admin dashboard with pagination and statistics
//@access Private (Admin only)
router.get("/dashboard/admin/orders", authMiddleware, authorizedRoles("Admin"), getAllOrdersAdmin);

/**
 * @swagger
 * /api/v1/dashboard/admin/orders/status/{orderId}/{status}:
 *   patch:
 *     summary: Update order status
 *     description: Updates order status by admin.
 *     tags:
 *       - Orders (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           enum: [pending, preparing, on-delivery, delivered, cancelled]
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *       400:
 *         description: Invalid status
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin only)
 *       404:
 *         description: Order not found
 *       500:
 *         description: Update failed
 */
//@route PATCH /api/v1/dashboard/admin/orders/status/:orderId/:status
//@desc Toggle order status ("pending", "preparing", "on-delivery", "delivered", "canceled")
//@access Private (Admin only)
router.patch("/dashboard/admin/orders/status/:orderId/:status", authMiddleware, authorizedRoles("Admin"), updateOrderStatus);

/**
 * @swagger
 * /api/v1/dashboard/admin/orders/{orderId}:
 *   delete:
 *     summary: Delete order permanently
 *     description: Permanently deletes a customer order. Admin access only.
 *     tags:
 *       - Orders (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin only)
 *       404:
 *         description: Order not found
 *       500:
 *         description: Delete failed
 */
//@route DELETE /api/v1/dashboard/admin/orders/:orderId
//@desc Delete order permanently (admin action)
//@access Private (Admin only)
router.delete("/dashboard/admin/orders/:orderId", authMiddleware, authorizedRoles("Admin"), deleteOrder);



export default router;