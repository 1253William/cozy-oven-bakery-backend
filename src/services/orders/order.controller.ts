import { Response } from "express";
import { AuthRequest } from '../../types/authRequest'
import Order from "./order.model";
import ProductModel from "../products/product.model";
import UserModel from "../account/user.model"
import redisClient from "../../config/redis";
import paystack from "../../config/paystack";
import { sendEmail } from '../../utils/email.transporter';
import { sendSMS } from "../../utils/sendSMS";
import { withTimeout } from "../../utils/helpers/timeOut";
import { cloudinaryHelper } from "../../utils/helpers/cloudinaryHelper";
import {generateReceiptPdfBuffer} from "../../utils/receiptGenerator";
import crypto from "crypto";

//@route POST /api/v1/store/customer/orders/checkout
//@desc Customer place order and check out.  Checkout: create order and lock totals.
//Frontend sends items + totals. Backend verifies product prices for a subset or all items,
//recomputes totals server-side and rejects if mismatch.
//@access Private (Customer only)
export const checkOut = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized: Authentication required" });
            return;
        }

        const { items, deliveryFee, deliveryAddress, contactNumber, paymentMethod = 'paystack' } = req.body;
        if (!items || !Array.isArray(items) || items.length === 0) {
            res.status(400).json({ success: false, message: "Order items are required" });
            return;
        }
        //Validate each item shape
        for (const it of items) {
            if (!it.productId || !it.quantity || !it.unitPrice) {
                res.status(400).json({ success: false, message: "Invalid item format" });
                return;
            }
        }

        //Fetch product price snapshots for verification (only id and price)
        const productIds = items.map((i: any) => i.productId);
        const products = await ProductModel.find({ _id: { $in: productIds } }).select("price productName productThumbnail sku").lean();

        // Build a map
        const productMap = new Map<string, any>();
        for (const p of products) productMap.set(String(p._id), p);

        //Calculate totals
        const enrichedItems: any[] = [];
        for (const it of items) {
            const p = productMap.get(String(it.productId));
            if (!p) {
                res.status(400).json({ success: false, message: `Product not found: ${it.productId}` });
                return;
            }
            // Use DB price (if selectOptions change price, front should include selected option index; adjust accordingly)
            const unitPrice = it.unitPrice || p.price || 0; // fallback to DB price if frontend didn't send
            const total = Number(unitPrice) * Number(it.quantity);
            enrichedItems.push({
                productId: it.productId,
                name: p.productName || it.name,
                thumbnail: p.productThumbnail || it.thumbnail,
                unitPrice,
                quantity: it.quantity,
                total
            });
        }
        const subtotal = enrichedItems.reduce((s, i) => s + i.total, 0);
        const totalAmount = subtotal + Number(deliveryFee || 0);
        //Auto-generate unique order ID like: CZ-948291
        const orderId = `CZ-${crypto.randomInt(100000, 999999)}`;

        //Save order
        const newOrder = await withTimeout(Order.create({
            userId,
            orderId,
            items: enrichedItems,
            subtotal,
            deliveryFee,
            totalAmount,
            paymentMethod,
            contactNumber,
            deliveryAddress,
            paymentStatus: paymentMethod === "cash-on-delivery" ? "pending" : "pending"
        }), 8000);

        //Invalidate Redis cache
        // try { await redisClient.del(`orders:${userId}`); } catch (err) { console.warn("Redis del failed", err); }

        res.status(201).json({
            success: true,
            message: "Order created successfully",
            order: newOrder,
        });
        return;

    } catch (error) {
        console.error("Order Checkout Error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
        return;
    }
};


//@route POST /api/v1/store/customer/orders/:orderId/initiate-dashboard overview
//@desc Customer initiate dashboard overview.
//initiatePayment - initialize Paystack transaction using locked order total.
//@access Private (Customer only)
export const initiatePayment = async (req: AuthRequest, res: Response) => {
    try {
        const { orderId } = req.params;
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized: Authentication required" });
            return;
        }
        const user = await UserModel.findById(userId).select("email").lean();
        if (!user || !user.email) {
            return res.status(400).json({ success: false, message: "Valid user email not found" });
        }
        console.log(user.email);

        const order = await Order.findOne({ orderId, userId });
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }
        if (order.paymentStatus === "paid") return res.status(400).json({ success: false, message: "Order already paid" });

        const reference = crypto.randomUUID();

        // const response = await paystack.post("/transaction/initialize", {
        //     email: req.user?.email,
        //     amount: order.totalAmount * 100, // Paystack uses kobo
        //     reference: crypto.randomUUID(),
        //     callback_url: `${process.env.BASE_URL}/api/v1/orders/verify`,
        // });

        const response = await withTimeout(paystack.post("/transaction/initialize", {
            email: user.email,
            amount: Math.round(order.totalAmount * 100), // kobo
            reference,
            callback_url: `${process.env.BASE_URL}/checkout/success` // frontend success page
        }), 10000);

        order.transactionRef = response.data.data.reference || reference;
        await withTimeout(order.save(), 5000);

        res.status(200).json({
            success: true,
            message: "Payment initialized successfully",
            authorizationUrl: response.data.data.authorization_url,
            reference: reference
        });
        return;

    } catch (error) {
        console.error("Payment init Error:", error);
        res.status(500).json({ success: false, message: "Payment initialization failed" });
        return;
    }
};


//@route GET /api/v1/store/customer/dashboard overview/verify?reference=xxx
//desc Verify dashboard overview. User-return verify (frontend calls after redirect)
//@access Private (Customer only)
export const verifyPayment = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized: Authentication required" });
            return;
        }
        const user = await UserModel.findById(userId).select("email").lean();
        if (!user || !user.email) {
            return res.status(400).json({ success: false, message: "Valid user email not found" });
        }

        const reference = String(req.query.reference || "");
        if (!reference) {
            return res.status(400).json({
                success: false,
                message: "Invalid or missing dashboard overview reference",
            });
        }

        //Verify from Paystack
        const response = await withTimeout(
            paystack.get(`/transaction/verify/${reference}`),
            10000
        );

        const status = response.data.data.status;

        if (status !== "success") {
            return res.status(400).json({
                success: false,
                message: "Payment not successful",
                raw: response.data,
            });
        }

        //Update order
        const order = await Order.findOneAndUpdate(
            { transactionRef: reference },
            { paymentStatus: "paid" },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        //Send email + SMS (non-blocking, safe)
        try {
            // EMAIL
            await sendEmail({
                email: user.email,
                subject: `Payment Successful - Order ${order.orderId}`,
                text: `
Your payment was successful.

Order ID: ${order.orderId}
Total Paid: GHS ${order.totalAmount}

Thank you for ordering from Cozy Oven!
        `,
            });

            //SMS
            await sendSMS({
                recipient: [order.contactNumber],
                message: `Your Cozy Oven order  ${order.orderId} is confirmed. Delivery will be arranged shortly. Thank you for shopping with us!`,
            });

        } catch (notifyErr) {
            console.warn("Notification (email/SMS) failed:", notifyErr);
        }

        return res.status(200).json({
            success: true,
            message: "Payment verified successfully",
            order,
        });

    } catch (error) {
        console.error("Payment Verify Error:", error);
        return res.status(500).json({
            success: false,
            message: "Verification failed",
        });
    }
};


/**
 * webhookHandler - Paystack webhook listener
 * Route: POST /api/v1/webhooks/paystack
 * Validate signature using PAYSTACK_SECRET_KEY (webhook secret) or compare event
 */
export const paystackWebhook = async (req: Request, res: Response) => {
    try {
        const signature = req.headers.get("x-paystack-signature") || "";
        const payload = JSON.stringify(req.body);

        // Validate HMAC SHA512 using your PAYSTACK_WEBHOOK_SECRET env var
        const secret = process.env.PAYSTACK_WEBHOOK_SECRET || "";
        const cryptoHmac = require("crypto").createHmac("sha512", secret).update(payload).digest("hex");
        if (signature !== cryptoHmac) {
            console.warn("Invalid paystack webhook signature");
            return res.status(400).send("Invalid signature");
        }

        const event = await req.json() as { event: string; data: { reference: string; status: string; customer?: { email: string } } };
        // sample: event.event = 'charge.success' or 'transaction.success' (Paystack has variants)
        if (event?.event === "charge.success" || event?.event === "transaction.success") {
            const ref = event.data.reference;
            const status = event.data.status;

            if (status === "success") {
                const order = await Order.findOne({ transactionRef: ref });
                if (!order) {
                    // maybe log for manual reconciliation
                    console.warn("Webhook: order not found for ref", ref);
                    res.status(200).send("ok");
                    return;
                }

                if (order.paymentStatus !== "paid") {
                    order.paymentStatus = "paid";
                    await order.save();

                    // generate receipt async-safe flow (try/catch)
                    try {
                        // send email and sms
                        await sendEmail({
                            email: (order as any).userIdEmail || event.data.customer?.email,
                            subject: `Receipt for ${order.orderId}`,
                            text: `<p>Payment confirmed for ${order.orderId}.</p><p><a href="${order.receiptUrl}">Download receipt</a></p>`
                        }).catch(err => console.warn("Email failed:", err));

                        await sendSMS({
                            recipient: [order.contactNumber],
                            message: `Payment confirmed for order ${order.orderId}.`
                        }).catch(err => console.warn("SMS failed:", err));
                    } catch (err) {
                        console.warn("Webhook post-dashboard overview tasks failed:", err);
                    }
                }
            }
        }

        res.status(200).send("ok");
    } catch (err) {
        console.error("Webhook handler error:", err);
        res.status(500).send("error");
    }
};


//@route GET /api/v1/store/customer/orders
//@desc Fetch customer orders
//@access Private (Customer only)
export const getMyOrders = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

        const cached = await redisClient.get(`orders:${userId}`);
        if (cached) {
            return res.json({ success: true, cached: true, data: JSON.parse(cached) });
        }

        const orders = await Order.find({ userId }).sort({ createdAt: -1 }).lean();
        await redisClient.setex(`orders:${userId}`, 300, JSON.stringify(orders));
        return res.json({ success: true, data: orders });

    } catch (error) {
        console.error("GetMyOrders error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch orders" });
        return;
    }
};


//@route GET /api/v1/dashboard/admin/orders
//@desc Fetch customer orders to admin dashboard
//@access Private (Admin only)
export const getAllOrdersAdmin = async (req: AuthRequest, res: Response) => {
    try {
        const orders = await Order.find().populate("userId", "email name").sort({ createdAt: -1 }).lean();
        res.json({ success: true, data: orders });
        return;

    } catch (error) {
        console.error("GetAllOrdersAdmin error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch all orders" });
        return;
    }
};


//@route PATCH /api/v1/dashboard/admin/orders/status/:orderId/
//@desc Toggle order status ("pending", "preparing", "on-delivery", "delivered", "canceled")
//@access Private (Admin only)
export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        const order = await Order.findOneAndUpdate(
            { orderId },
            { orderStatus: status },
            { new: true }
        );
        //Send email and sms to customer about order status change

        res.json({ success: true, message: "Order updated", order });
    } catch (error) {
        console.error("Update order status error:", error);
        res.status(500).json({ success: false, message: "Update failed" });
        return;
    }
};


//@route PATCH /api/v1/dashboard/admin/orders/:orderId/
//@desc Delete order permanently
//@access Private (Admin only)
export const deleteOrder = async (req: AuthRequest, res: Response) => {
    try {
        const { orderId } = req.params;

        await Order.findOneAndDelete({ orderId });

        res.json({ success: true, message: "Order deleted permanently" });
    } catch (error) {
        console.error("Delete order error:", error);
        res.status(500).json({ success: false, message: "Delete failed" });
    }
};


/**
 * getReceipt (download)
 */
//@route GET /api/v1/store/customer/orders/:orderId/receipt
export const getReceipt = async (req: AuthRequest, res: Response) => {
    try {
        const { orderId } = req.params;
        const order = await Order.findOne({ orderId }).lean();
        if (!order) return res.status(404).json({ success: false, message: "Order not found" });

        if (!order.receiptUrl) {
            // generate on-demand
            const pdfBuffer = await generateReceiptPdfBuffer(order as any);
            const upload = await cloudinaryHelper.uploadFile(pdfBuffer as any, "cozyoven/receipts");
            if (upload?.url) {
                await Order.updateOne({ orderId }, { receiptUrl: upload.url });
                return res.redirect(upload.url);
            }
        }
        return res.redirect(order.receiptUrl as string);
    } catch (err) {
        console.error("Get receipt error:", err);
        res.status(500).json({ success: false, message: "Failed to fetch receipt" });
    }
};
