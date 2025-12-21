import { Response } from "express";
import { AuthRequest } from '../../types/authRequest'
import Order from "./order.model";
import ProductModel from "../products/product.model";
import hubtel from "../../config/hubtel";
import { sendEmail } from '../../utils/email.transporter';
import { sendSMS } from "../../utils/sendSMS";
import { withTimeout } from "../../utils/helpers/timeOut";
import { cloudinaryHelper } from "../../utils/helpers/cloudinaryHelper";
import { notifyUserAsync } from "../../utils/helpers/notifyUserAsync";
import { createNotification } from "../notifications/notification.service";
import { hubtelStatusClient } from "../../utils/helpers/hubtelStatusClient";
import {generateReceiptPdfBuffer} from "../../utils/receiptGenerator";
import crypto from "crypto";


//@route POST /api/v1/store/customer/orders/checkout
//@desc Customer places order and check out.  Checkout: create order and lock totals.
//Frontend sends items and totals. Backend verifies product prices for a subset or all items,
//recomputes totals server-side and rejects if mismatched.
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
        const subtotal = Number(enrichedItems.reduce((s, i) => s + i.total, 0).toFixed(2));
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


//@route POST /api/v1/store/customer/orders/:orderId/initiate-payment
//@desc Initiate Hubtel payment
//Backend creates Hubtel checkout
//Backend returns checkoutUrl
//Frontend redirects customer
//@access Private (Customer only)
export const initiatePayment = async (req: AuthRequest, res: Response) => {
    try {
        const { orderId } = req.params;
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const order = await Order.findOne({ orderId, userId });
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        if (order.paymentStatus === "paid") {
            return res.status(400).json({ success: false, message: "Order already paid" });
        }

        const payload = {
            totalAmount: Number(order.totalAmount.toFixed(2)),
            description: `Payment for order ${order.orderId}`,
            callbackUrl: `${process.env.BASE_URL}/api/v1/webhooks/hubtel`,
            returnUrl: `${process.env.FRONTEND_URL}/checkout/success`,
            cancellationUrl: `${process.env.FRONTEND_URL}/checkout/cancel`,
            merchantAccountNumber: process.env.HUBTEL_MERCHANT_ID,
            clientReference: order.orderId,
        };

        const response = await hubtel.post(
            "/items/initiate",
            payload
        );

        if (!response?.data?.data?.checkoutUrl) {
            throw new Error("Invalid Hubtel response");
        }

        //Hubtel Checkout URL
        order.transactionRef = order.orderId;
        await order.save();

        return res.status(200).json({
            success: true,
            message: "Hubtel payment initialized",
            checkoutUrl: response.data.data.checkoutUrl,
        });

    } catch (error) {
        console.error("Hubtel init error:", (error as any)?.response?.data || error);
        return res.status(500).json({
            success: false,
            message: "Failed to initiate Hubtel payment",
        });
    }
};



/**
 * webhookHandler - Hubtel webhook listener
 * Route: POST  /api/v1/webhooks/hubtel
 */
//@route POST /api/v1/webhooks/hubtel
//@desc Hubtel webhook listener
//@access Public (Hubtel Webhook)
export const hubtelWebhook = async (req: AuthRequest, res: Response) => {
    try {
        const status = req.body?.Data?.Status;
        const clientReference = req.body?.Data?.ClientReference;

        if (status !== "Success" || !clientReference) {
            return res.status(200).send("Ignored: Invalid status or clientReference");
        }

        const order = await Order.findOne({ orderId: clientReference })
            .populate("userId","email")
        if (!order) {
            console.warn("Webhook order not found:", clientReference);
            return res.status(200).send("OK");
        }

        const userEmail = (order.userId as {email?:string})?.email;
        if (!userEmail) {
            return res.status(200).send("Ignored: User email not found");
        }

        if (order.paymentStatus !== "paid") {
            order.paymentStatus = "paid";
            order.paidAt = new Date();
            await order.save();

            //EMAIL
            await sendEmail({
                email: userEmail,
                subject: `Payment Successful - Order ${order.orderId}`,
                text: `
Your payment was successful.

Order ID: ${order.orderId}
Total Paid: GHS ${order.totalAmount}

Thank you for ordering from Cozy Oven!

©Cozy Oven Store. All rights reserved
        `,
            });


            //Notifications (safe async)
            await createNotification({
                title: "Payment Successful",
                message: `Order #${order.orderId} has been paid via Hubtel`,
                type: "order",
                metadata: { orderId: order._id },
            });

            //SMS
            await sendSMS({
                recipient: [order.contactNumber],
                message: `Your Cozy Oven order  ${order.orderId} is confirmed. Delivery will be arranged shortly. Thank you for shopping with us!`,
            });
        }

        return res.status(200).send("Payment Successful");

    } catch (err) {
        console.error("Hubtel webhook error:", err);
        return res.status(200).send("error: An error occurred while processing the webhook");
    }
};


//CRON job
//Outbound IPs whitelisted
export const checkHubtelStatus = async (orderId: string) => {
    const res = await hubtelStatusClient.get(
        `/transactions/${process.env.HUBTEL_MERCHANT_ID}/status`,
        { params: { clientReference: orderId } }
    );

    return res.data;
};



//@route GET /api/v1/store/customer/order-history
//@desc Fetch customer orders
//@access Private (Customer only)
export const getMyOrders = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
            return;
        }

        // Pagination
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        // Optional: filter by status
        const status = req.query.status as string;
        const statusFilter = status ? { orderStatus: status } : {};

        const query = { userId, ...statusFilter };

        // Fetch orders plus total count
        const [orders, totalOrders] = await Promise.all([
            Order.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .select("orderId items totalAmount orderStatus createdAt")
                .lean(),

            Order.countDocuments(query),
        ]);

        //Convert to UI-friendly format
        const formattedOrders = orders.map(order => ({
            orderId: order.orderId,
            title: order.items?.[0]?.name || "Order Items",
            image: order.items?.[0]?.thumbnail || null,
            orderedOn: new Date(order.createdAt).toLocaleDateString("en-US", {
                day: "numeric",
                month: "long",
                year: "numeric",
            }),
            price: order.totalAmount,
            status: order.orderStatus,
        }));

        res.status(200).json({
            success: true,
            message: "Order history fetched successfully",
            meta: {
                totalOrders,
                totalPages: Math.ceil(totalOrders / limit),
                currentPage: page,
                limit,
            },
            data: formattedOrders,
        });
        return;

    } catch (error) {
        console.error("GetMyOrders error:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error: Failed to fetch orders",
        });
        return;
    }
};


//@route GET /api/v1/dashboard/admin/orders
//@desc Fetch customer orders to admin dashboard with pagination and order statistics
//@access Private (Admin only)
export const getAllOrdersAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const page = Number(req.query.page as string) || 1;
        const limit = Number(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        //Filter for only Paid orders
        const filter = { paymentStatus: "paid" };


        // --- ORDER STATISTICS ---
        const [orderStats] = await Order.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    pending: { $sum: { $cond: [{ $eq: ["$orderStatus", "pending"] }, 1, 0] } },
                    preparing: { $sum: { $cond: [{ $eq: ["$orderStatus", "preparing"] }, 1, 0] } },
                    delivered: { $sum: { $cond: [{ $eq: ["$orderStatus", "delivered"] }, 1, 0] } },
                    cancelled: { $sum: { $cond: [{ $eq: ["$orderStatus", "cancelled"] }, 1, 0] } },
                    totalRevenue: { $sum: "$totalAmount" }
                }
            }
        ]);

        // --- FETCH PAGINATED ORDERS ---
        const rawOrders = await Order.find(filter)
            .populate<{ userId: { fullName?: string; email?: string; paidAt?:Date; } }>({ path: "userId", select: "fullName email" })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        // --- FORMAT ORDERS FOR UI ---
        const orders = rawOrders.map(order => ({
            orderId: order.orderId,
            customer: (order.userId as { fullName?: string })?.fullName || "Unknown",
            email: (order.userId as { email?: string })?.email || "Unknown",
            items: `${order.items.length} items`,
            amount: `GHS ${order.totalAmount.toFixed(2)}`,
            status: order.orderStatus,
            paymentStatus: order.paymentStatus,
            paidAt: order.paidAt?.toLocaleDateString("en-GB"),
            date: new Date(order.createdAt).toLocaleDateString("en-GB"), // DD/MM/YYYY
        }));

        const totalOrders = await Order.countDocuments(filter);

        res.status(200).json({
            success: true,
            message: "All Orders fetched successfully",
            data: {
                orders,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalOrders / limit),
                    totalOrders,
                    hasNext: skip + limit < totalOrders,
                    hasPrev: page > 1
                },
                statistics:
                    orderStats.length > 0
                        ? {
                            totalOrders: orderStats[0].totalOrders,
                            pending: orderStats[0].pending,
                            preparing: orderStats[0].preparing,
                            delivered: orderStats[0].delivered,
                            cancelled: orderStats[0].cancelled,
                            totalRevenue: orderStats[0].totalRevenue
                        }
                        : {
                            totalOrders: 0,
                            pending: 0,
                            preparing: 0,
                            delivered: 0,
                            cancelled: 0,
                            totalRevenue: 0
                        }
            }
        });

    } catch (error) {
        console.error("GetAllOrdersAdmin error:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error: Failed to fetch all orders"
        });
        return;
    }
};


//@route GET /api/v1/dashboard/admin/orders/:orderId
//@desc Fetch a specific PAID order with full item details for admin modal
//@access Private (Admin only)
export const getOrderByOrderId = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { orderId } = req.params;

        const order = await Order.findOne({
            orderId,
            paymentStatus: "paid"
        })
            .populate<{ userId: { fullName?: string; email?: string } }>({
                path: "userId",
                select: "fullName email"
            })
            .lean();

        if (!order) {
            res.status(404).json({
                success: false,
                message: "Paid order not found"
            });
            return;
        }

        // ==============================
        // FORMAT FOR ADMIN MODAL
        // ==============================
        const response = {
            orderId: order.orderId,
            customer: {
                name: order.userId?.fullName || "Unknown",
                email: order.userId?.email || "Unknown",
                contactNumber: order.contactNumber,
                deliveryAddress: order.deliveryAddress
            },
            items: order.items.map(item => ({
                productId: item.productId,
                name: item.name,
                thumbnail: item.thumbnail,
                unitPrice: item.unitPrice,
                quantity: item.quantity,
                total: item.total
            })),
            pricing: {
                subtotal: order.subtotal,
                deliveryFee: order.deliveryFee,
                totalAmount: order.totalAmount
            },
            payment: {
                status: order.paymentStatus,
                method: order.paymentMethod,
                transactionRef: order.transactionRef,
                paidAt: order.paidAt
            },
            orderStatus: order.orderStatus,
            createdAt: order.createdAt
        };

        res.status(200).json({
            success: true,
            message: "Order fetched successfully",
            data: response
        });
        return;

    } catch (error) {
        console.error("GetAdminOrderByOrderId error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch order details"
        });
        return;
    }
};


//@route PATCH /api/v1/dashboard/admin/orders/status/:orderId/:status
//@desc Toggle order status ("pending", "preparing", "on-delivery", "delivered", "cancelled")
//@access Private (Admin only)
export const updateOrderStatus = async (req: AuthRequest, res: Response):Promise<void> => {
    try {
        const { orderId, status } = req.params;

        const validStatuses = ["pending", "preparing", "on-delivery", "delivered", "cancelled"];
        if (!validStatuses.includes(status)) {
            res.status(400).json({
                success: false,
                message: `Invalid status. Allowed: ${validStatuses.join(", ")}`
            });
            return;
        }

        // Find order with customer fields
        const order = await Order.findOne({ orderId }).populate<{ userId: { fullName?: string; email?: string } }>({ path: "userId", select: "fullName email" });
        if (!order) {
            res.status(404).json({ success: false, message: "Order not found" });
            return;
        }

        // Prevent updates to completed orders
        if (["delivered", "cancelled"].includes(order.orderStatus)) {
            res.status(400).json({
                success: false,
                message: `Cannot update a ${order.orderStatus} order`
            });
            return;
        }

        const orderStatus = status as "pending" | "preparing" | "on-delivery" | "delivered" | "cancelled";
        order.orderStatus = orderStatus;

        // Add to timeline
        // order.orderTimeline.push({
        //     status,
        //     message: `Order marked as ${status} by admin`,
        //     timestamp: new Date()
        // });

        await order.save();

        await notifyUserAsync(order, { email: (order.userId as { email?: string })?.email || '', name: (order.userId as { fullName?: string })?.fullName }, orderStatus);

        try {

            if (orderStatus === "delivered") {
                await createNotification({
                    title: "Order Delivered",
                    message: `Order #${order.orderId} has been successfully delivered`,
                    type: "order",
                    metadata: {
                        orderId: order._id
                    }
                });
            }

        } catch (notifyErr) {
            console.warn("Notification (email/SMS) failed:", notifyErr);
        }

        //response
        res.status(200).json({
            success: true,
            message: `Order status updated to ${status}`,
            order: {
                orderId: order.orderId,
                status: order.orderStatus,
                items: `${order.items.length} items`,
                total: `GHS ${order.totalAmount.toFixed(2)}`,
                customer: (order.userId as { fullName?: string })?.fullName || "Unknown",
                email: (order.userId as { email?: string })?.email || "Unknown",
                date: new Date(order.createdAt).toLocaleDateString("en-GB"),
            }
        });
        return;

    } catch (error) {
        console.error("Update order status error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error: Update failed" });
        return;
    }
};


//@route DELETE /api/v1/dashboard/admin/orders/:orderId
//@desc Delete order permanently (admin action)
//@access Private (Admin only)
export const deleteOrder = async (req: AuthRequest, res: Response) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findOne({ orderId }).populate("userId");
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        await Order.deleteOne({ orderId });

        //Audit log
        // await AdminLog.create({
        //     admin: req.user?.id,
        //     action: "ORDER_DELETE",
        //     referenceId: orderId,
        //     details: {
        //         beforeDelete: order,
        //     },
        //     timestamp: new Date(),
        // });

        // 4. OPTIONAL: notify user non-blocking (if business requires)
        await (async () => {
            try {
                if ((order.userId as { email?: string })?.email) {
                    await sendEmail({
                        email: (order.userId as { email?: string })?.email || '',
                        subject: `Order ${orderId} Removed`,
                        text: `
Your order (ID: ${orderId}) has been removed from our system
by Cozy Oven administration.

If you believe this was a mistake, please contact support.
                        `,
                    });
                }
            } catch (notifyErr) {
                console.error("Delete notification error:", notifyErr);
            }
        })();

        return res.json({
            success: true,
            message: "Order deleted permanently",
        });

    } catch (error) {
        console.error("Delete order error:", error);
        return res.status(500).json({
            success: false,
            message: "Delete failed",
        });
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
