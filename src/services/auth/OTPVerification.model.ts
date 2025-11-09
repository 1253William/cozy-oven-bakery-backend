import mongoose, { Schema, Document } from 'mongoose';

export interface PasswordReset extends Document {
    userId: string;
    email: string;
    otp: string;
    expiresAt: Date;
}

const PasswordResetSchema: Schema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    email: { type: String, required: true },
    otp: { type: String, required: true },
    expiresAt: { type: Date, required: true },
}, {
    timestamps: true,
});

export default mongoose.model<PasswordReset>('PasswordReset', PasswordResetSchema);
