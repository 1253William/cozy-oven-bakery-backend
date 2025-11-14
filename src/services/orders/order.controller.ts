// import { Response } from "express";
// import { AuthRequest } from '../../types/authRequest'
// import Order from "./order.model";
// import redisClient from "../../config/redis";
// import crypto from "crypto";
//
// export const createOrder = async (req: AuthRequest, res: Response) => {
//     try {
//         const userId = req.user?.userId;
//         if (!userId) {
//             res.status(401).json({ success: false, message: "Unauthorized" });
//             return;
//         }
//
//         const { items, deliveryFee, deliveryAddress, contactNumber, paymentMethod } =
//             req.body;
//
//         if (!items || items.length === 0) {
//             res.status(400).json({
//                 success: false,
//                 message: "Order items are required",
//             });
//             return;
//         }
//
//         // 🔹 Auto-generate unique order ID like: CZ-948291
//         const orderId = `CZ-${crypto.randomInt(100000, 999999)}`;
//
//         // 🔹 Calculate totals
//         const enrichedItems = items.map((item: any) => ({
//             ...item,
//             total: item.unitPrice * item.quantity,
//         }));
//
//         const subtotal = enrichedItems.reduce((sum: number, i: any) => sum + i.total, 0);
//         const totalAmount = subtotal + deliveryFee;
//
//         // 🔹 Save order
//         const newOrder = await Order.create({
//             userId,
//             orderId,
//             items: enrichedItems,
//             subtotal,
//             deliveryFee,
//             totalAmount,
//             deliveryAddress,
//             contactNumber,
//             paymentMethod,
//             paymentStatus: paymentMethod === "cash-on-delivery" ? "pending" : "pending",
//         });
//
//         // 🔹 Invalidate Redis cache
//         await redisClient.del(`order-history:${userId}:page:1`);
//
//         res.status(201).json({
//             success: true,
//             message: "Order created successfully",
//             orderId: newOrder.orderId,
//             order: newOrder,
//         });
//     } catch (error) {
//         console.error("Order Creation Error:", error);
//         res.status(500).json({ success: false, message: "Internal server error" });
//     }
// };
