import mongoose, { Schema, Document } from "mongoose";

export interface IReport extends Document {
    month: string;
    year: string;
    totalRevenue: number;
    totalExpenses: number;
    profit: number;
    profitMargin: number;
    profitMarginExplanation: string;

    createdAt: Date;
}

const ReportSchema = new Schema<IReport>(
    {
        month: { type: String, required: true },
        year: { type: String, required: true },

        totalRevenue: Number,
        totalExpenses: Number,
        profit: Number,
        profitMargin: Number,
        profitMarginExplanation: String
    },
    { timestamps: true }
);

ReportSchema.index({ month: 1, year: 1 }, { unique: true });

export default mongoose.model<IReport>("Report", ReportSchema);
