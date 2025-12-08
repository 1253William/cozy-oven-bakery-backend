import { sendEmail } from '../email.transporter';
import { sendSMS } from "../sendSMS";

interface Order {
    orderId: string;
    totalAmount: number;
    contactNumber: string;
}

export const notifyUserAsync = async (order: Order, user: { name?: string; email: string }, newStatus: 'pending' | 'preparing' | 'on-delivery' | 'delivered' | 'cancelled') => {
    const statusMessages: Record<'pending' | 'preparing' | 'on-delivery' | 'delivered' | 'cancelled', string> = {
        pending: `Your order ${order.orderId} is now pending.`,
        preparing: `Your order ${order.orderId} is being prepared.`,
        "on-delivery": `Your order ${order.orderId} is out for delivery.`,
        delivered: `Your order ${order.orderId} has been delivered. Thank you!`,
        cancelled: `Your order ${order.orderId} has been cancelled.`,
    };

    const emailMessage = `
Hello ${user?.name || "Customer"},

Your order status has been updated.

Order: ${order.orderId}
New Status: ${newStatus}
Total Amount: GHS ${order.totalAmount}

${statusMessages[newStatus]}

Thank you for ordering from Cozy Oven!
    `;

    const smsMessage = statusMessages[newStatus];

    // Send notifications but do not block API response
    Promise.all([
        sendEmail({
            email: user.email,
            subject: `Order Update - ${order.orderId} is now ${newStatus}`,
            text: emailMessage,
        }),

        sendSMS({
            recipient: [order.contactNumber],
            message: smsMessage
        })
    ]).catch(err => {
        console.error("Notification send error:", err);
    });
};
