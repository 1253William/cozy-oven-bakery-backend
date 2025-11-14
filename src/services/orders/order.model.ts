import mongoose, { Document, Schema, Model } from "mongoose";

export interface IOrderItem {
    productId: mongoose.Types.ObjectId;
    name: string;
    thumbnail: string;
    unitPrice: number;     // Price per item
    quantity: number;
    total: number;         // unitPrice * quantity
}

export interface IOrder extends Document {
    userId: mongoose.Types.ObjectId;
    orderId: string;        // CozyOven-6digit or UUID
    items: IOrderItem[];
    subtotal: number;
    deliveryFee: number;
    totalAmount: number;
    paymentStatus: "pending" | "paid" | "failed" | "refunded";
    orderStatus:
        | "pending"
        | "preparing"
        | "on-delivery"
        | "delivered"
        | "cancelled";
    deliveryAddress: string;
    contactNumber: string;
    paymentMethod: "paystack" | "card" | "cash-on-delivery";
    transactionRef?: string;
    createdAt: Date;
    updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>({
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    thumbnail: { type: String, required: true },
    unitPrice: { type: Number, required: true },
    quantity: { type: Number, required: true },
    total: { type: Number, required: true },
});

const OrderSchema = new Schema<IOrder>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        orderId: { type: String, required: true },
        items: { type: [OrderItemSchema], required: true },
        subtotal: { type: Number, required: true },
        deliveryFee: { type: Number, default: 0 },
        totalAmount: { type: Number, required: true },
        paymentStatus: {
            type: String,
            enum: ["pending", "paid", "failed", "refunded"],
            default: "pending",
        },
        orderStatus: {
            type: String,
            enum: [
                "pending",
                "preparing",
                "on-delivery",
                "delivered",
                "cancelled",
            ],
            default: "pending",
        },
        deliveryAddress: { type: String, required: true },
        contactNumber: { type: String, required: true },
        paymentMethod: {
            type: String,
            enum: ["paystack", "card", "cash-on-delivery"],
            default: "paystack",
        },
        transactionRef: { type: String },
    },
    { timestamps: true }
);

// Auto-calc totals
OrderSchema.pre("validate", function (next) {
    this.subtotal = this.items.reduce((sum, item) => sum + item.total, 0);
    this.totalAmount = this.subtotal + this.deliveryFee;
    next();
});

//INDEXES for super-fast queries
OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ orderId: 1 });
OrderSchema.index({ paymentStatus: 1 });
OrderSchema.index({ orderStatus: 1 });

const Order: Model<IOrder> = mongoose.model<IOrder>("Order", OrderSchema);
export default Order;
