import mongoose, { Schema, Document, Model } from "mongoose";
import {IProduct} from "../products/product.model";

// Wishlist Model
export interface IWishlistItem  extends Document {
    id: string;
    userId: mongoose.Types.ObjectId;
    productId: mongoose.Types.ObjectId;
    createdAt: Date;
}

//Schema
const WishlistSchema: Schema<IWishlistItem> = new Schema(
    {
        id: { type: String, required: true },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
        }

    }
)


WishlistSchema.index({ userId: 1, productId: 1 }, { unique: true});

const WishlistModel: Model<IWishlistItem> = mongoose.model<IWishlistItem>("Wishlist", WishlistSchema);
export default WishlistModel;