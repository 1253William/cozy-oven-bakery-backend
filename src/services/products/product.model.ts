import mongoose, { Schema, Document, Model } from "mongoose";

//product.model.ts

//Product Interface
export interface IProduct extends Document {
    productId: mongoose.Types.ObjectId;
    productName: string;
    productThumbnail: string; // Cloudinary URL
    productDetails: string;
    price: number;
    productCategory: "Family Size" | "Midi Size" | "Flight Box 3-set" | "Flight Box 4-set" | "Special Package or Offer";
    productStatus: "in stock" | "low stock" | "out of stock";
    isAvailable: boolean;
    rating: number; // 0–5 stars
    stockQuantity: number;
    sku: string;
    dateAdded: Date;
}

//Product Schema
const ProductSchema: Schema<IProduct> = new Schema(
    {
        productId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            index: true
        },
        productName: {
            type: String,
            required: [true, "Product name is required"],
            trim: true,
            maxlength: 100,
        },
        productThumbnail: {
            type: String,
            required: [true, "Product thumbnail URL is required"],
        },
        productDetails: {
            type: String,
            trim: true,
            maxlength: 500,
        },
        price: {
            type: Number,
            required: [true, "Price is required"],
            min: [0, "Price cannot be negative"],
        },
        productCategory: {
            type: String,
            enum: [
                "Family Size",
                "Midi Size",
                "Flight Box 3-set",
                "Flight Box 4-set",
                "Special Package or Offer",
            ],
            required: [true, "Product category is required"],
        },
        productStatus: {
            type: String,
            enum: ["in stock", "low stock", "out of stock"],
            default: "in stock",
        },
        isAvailable: {
            type: Boolean,
            default: true,
        },
        rating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
        },
        dateAdded: {
            type: Date,
            default: Date.now,
        }
    },
    {
        timestamps: true,
    }
);

//Indexes for performance
ProductSchema.index({ productId: 1 });
ProductSchema.index({ productCategory: 1 });
ProductSchema.index({ productName: "text", productDetails: "text" });

const ProductModel: Model<IProduct> = mongoose.model<IProduct>("Product", ProductSchema);
export default ProductModel;
