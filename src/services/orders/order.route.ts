import express from "express";
import { authMiddleware } from "../../middlewares/authentication.middleware";
import { authorizedRoles } from "../../middlewares/roles.middleware";
import {
    checkOut,
    initiatePayment,
    verifyPayment,
    getMyOrders,
    getReceipt,
    paystackWebhook,
    getAllOrdersAdmin,
    updateOrderStatus,
    deleteOrder,
} from "./order.controller";

const router = express.Router();



//Customer Order routes
router.post("/store/customer/orders/checkout", authMiddleware,authorizedRoles("Customer"), checkOut);
router.post("/store/customer/orders/:orderId/initiate-payment", authMiddleware,authorizedRoles("Customer"), initiatePayment);
router.get("/store/customer/payment/verify", authMiddleware, authorizedRoles("Customer"), verifyPayment);
router.get("/store/customer/orders", authMiddleware,authorizedRoles("Customer"), getMyOrders);
router.get("/store/customer/orders/:orderId/receipt", authMiddleware, authorizedRoles("Customer"), getReceipt);

//Webhook (no auth, but validates signature)
// router.post("/webhooks/paystack", express.json({ type: "*/*" }), paystackWebhook);


//Admin Order routes
router.get("/dashboard/admin/orders", authMiddleware, authorizedRoles("Admin"), getAllOrdersAdmin);
router.patch("/dashboard/admin/orders/status/:orderId", authMiddleware, authorizedRoles("Admin"), updateOrderStatus);
router.delete("/dashboard/admin/orders/:orderId", authMiddleware, authorizedRoles("Admin"), deleteOrder);



export default router;