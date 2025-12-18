import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
    title: string;
    message: string;
    type: "order" | "inventory" | "system";
    isRead: boolean;
    metadata?: Record<string, any>;
    createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
    {
        title: {
            type: String,
            required: true
        },
        message: {
            type: String,
            required: true
        },
        type: {
            type: String,
            enum: ["order", "inventory", "system"],
            required: true
        },
        isRead: {
            type: Boolean,
            default: false
        },
        metadata: {
            type: Schema.Types.Mixed
        }
    },
    { timestamps: true }
);

export default mongoose.model<INotification>(
    "Notification",
    NotificationSchema
);
