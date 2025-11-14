// import axios from "axios";
// import { Response } from "express";
// import { AuthRequest } from "../../middleware/auth";
// import crypto from "crypto";
// import Order from "../../models/order.model";
// import redisClient from "../../config/redis";
//
// frontend calls this to generate the Paystack checkout link.
// export const initiatePaystack = async (req: AuthRequest, res: Response) => {
//     try {
//         const { email, amount, orderId } = req.body;
//
//         if (!email || !amount || !orderId) {
//             res.status(400).json({
//                 success: false,
//                 message: "email, amount, orderId required",
//             });
//             return;
//         }
//
//         const response = await axios.post(
//             "https://api.paystack.co/transaction/initialize",
//             {
//                 email,
//                 amount: amount * 100, // Paystack ONLY accepts kobo
//                 metadata: { orderId },
//             },
//             {
//                 headers: {
//                     Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
//                 },
//             }
//         );
//
//         res.status(200).json({
//             success: true,
//             data: response.data.data, // includes authorization_url
//         });
//     } catch (error: any) {
//         console.log("Paystack init error:", error.response?.data || error);
//         res.status(500).json({
//             success: false,
//             message: "Payment initialization failed",
//         });
//     }
// };

//Webhook verification
//When payment succeeds, Paystack calls this endpoint.
//Then: Verify signature, Mark order as paid, Notify user via email/SMS/Push, Trigger redis cache cleanup
// export const paystackWebhook = async (req: Request, res: Response) => {
//     const secret = process.env.PAYSTACK_SECRET_KEY!;
//
//     // Signature validation
//     const hash = crypto
//         .createHmac("sha512", secret)
//         .update(JSON.stringify(req.body))
//         .digest("hex");
//
//     if (hash !== req.headers["x-paystack-signature"]) {
//         return res.status(401).json({ success: false, message: "Invalid signature" });
//     }
//
//     const eventData = req.body.data;
//
//     if (req.body.event === "charge.success") {
//         const orderId = eventData.metadata.orderId;
//
//         const order = await Order.findOneAndUpdate(
//             { orderId },
//             { paymentStatus: "paid", transactionRef: eventData.reference },
//             { new: true }
//         );
//
//         if (order) {
//             await redisClient.del(`order-history:${order.userId}:page:1`);
//         }
//     }
//
//     res.status(200).json({ success: true });
// };

