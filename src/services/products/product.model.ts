import mongoose, { Schema, Document, Model } from "mongoose";

//Review Subdocument
export interface ICustomerReview {
    userId: mongoose.Types.ObjectId;
    rating: number;              // 1–5 stars
    comment: string;
    reviewedAt: Date;
}

//Select Options (e.g. flavors, sizes, variants)
export interface ISelectOption {
    label: string;               // e.g. "Large", "Chocolate", "Vanilla"
    additionalPrice?: number;    // Optional extra cost
    sku?: string;                // Variant-specific SKU
    stockQuantity?: number;      // Variant stock
}

//Product Interface
export interface IProduct extends Document {
    productName: string;
    productThumbnail: string;
    productPublicId: string;
    productDetails: string;

    price: number;                     // Base price
    sku: string;                       // Main SKU
    stockQuantity: number;

    productCategory: string;

    productStatus: "in stock" | "low stock" | "out of stock";
    isAvailable: boolean;

    rating: number;
    customerReviews: ICustomerReview[];

    selectOptions: ISelectOption[];

    dateAdded: Date;
}

// --------------------
// Product Schema
// --------------------
const CustomerReviewSchema = new Schema<ICustomerReview>(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        rating: { type: Number, min: 1, max: 5, required: true },
        comment: { type: String, trim: true },
        reviewedAt: { type: Date, default: Date.now }
    },
    { _id: false }
);

const SelectOptionSchema = new Schema<ISelectOption>(
    {
        label: { type: String, required: true },
        additionalPrice: { type: Number, default: 0 },
        sku: { type: String, trim: true },
        stockQuantity: { type: Number, default: 0 }
    },
    { _id: false }
);

const ProductSchema: Schema<IProduct> = new Schema(
    {
        productName: {
            type: String,
            required: [true, "Product name is required"],
            trim: true,
            maxlength: 150
        },
        productThumbnail: {
            type: String,
            required: [true, "Product thumbnail is required"]
        },
        productPublicId: {
            type: String
        },
        productDetails: {
            type: String,
            trim: true,
            maxlength: 1000
        },
        price: {
            type: Number,
            required: true,
            min: 0
        },
        sku: {
            type: String,
            required: true,
            trim: true
        },
        stockQuantity: {
            type: Number,
            default: 0,
            min: 0
        },
        productCategory: {
            type: String,
            required: true,
        },
        productStatus: {
            type: String,
            enum: ["in stock", "low stock", "out of stock"],
            default: "in stock"
        },
        isAvailable: {
            type: Boolean,
            default: true
        },
        rating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },
        customerReviews: {
            type: [CustomerReviewSchema],
            default: []
        },
        selectOptions: {
            type: [SelectOptionSchema],
            default: []
        },
        dateAdded: {
            type: Date,
            default: Date.now
        }
    },
    { timestamps: true }
);

// --------------------
// Indexes for performance
// --------------------
ProductSchema.index({ sku: 1 }, { unique: true });
ProductSchema.index({ productCategory: 1 });
ProductSchema.index({ productName: "text", productDetails: "text" });
ProductSchema.index({ price: 1 });
ProductSchema.index({ stockQuantity: 1 });
ProductSchema.index({ rating: -1 });

const ProductModel: Model<IProduct> = mongoose.model<IProduct>("Product", ProductSchema);
export default ProductModel;
