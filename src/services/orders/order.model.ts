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
    deliveryFee?: number;
    totalAmount: number;
    paymentStatus: "pending" | "paid" | "failed" | "refunded";
    paidAt?: Date;
    orderStatus:
        | "pending"
        | "preparing"
        | "on-delivery"
        | "delivered"
        | "cancelled";
    deliveryAddress: string;
    city?: string,
    specialInstructions?: string,
    contactNumber: string;
    paymentMethod: "hubtel" | "cash-on-delivery";
    transactionRef?: string; //paystack reference
    receiptUrl?: string; //uploaded pdf url
    metadata?:Record<string, any>; //optional analytics
    createdAt: Date;
    updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>({
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    thumbnail: { type: String },
    unitPrice: { type: Number, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    total: { type: Number, required: true, min: 0 }
}, { _id: false });

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
        paidAt: { type: Date },
        orderStatus: {
            type: String,
            enum: [
                "pending",
                "preparing",
                "on-delivery",
                "delivered",
                "canceled",
            ],
            default: "pending",
        },
        deliveryAddress: { type: String, required: true },
        city: { type: String },
        specialInstructions: { type: String },
        contactNumber: { type: String, required: true },
        paymentMethod: {
            type: String,
            enum: ["hubtel", "cash-on-delivery"],
            default: "hubtel",
        },
        transactionRef: { type: String },
        receiptUrl: { type: String },
        metadata: { type: Schema.Types.Mixed, default: {} }
    },
    { timestamps: true }
);

//Auto-calc totals
OrderSchema.pre("validate", function (next) {
    try {
        this.subtotal = this.items.reduce((s: number, it: any) => s + (it.total || 0), 0);
        this.totalAmount = (this.subtotal || 0) + (this.deliveryFee || 0);
        next();
    } catch (err) {
        next(err as any);
    }
});

//INDEXES for super-fast queries
OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ orderId: 1 });
OrderSchema.index({ paymentStatus: 1, paidAt: 1 });
OrderSchema.index({ orderStatus: 1 });
OrderSchema.index({ transactionRef: 1 });

const Order: Model<IOrder> = mongoose.model<IOrder>("Order", OrderSchema);
export default Order;
