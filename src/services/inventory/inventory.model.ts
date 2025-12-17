import mongoose, { Schema, Document, Model } from "mongoose";

//Monthly Profit = Total Sales – Total Inventory Expenses
//Profit Margin (%) = (Profit ÷ Total Sales) × 100

export interface IInventory extends Document {
    userId: mongoose.Types.ObjectId;
    itemName: string;
    itemSKU: string;
    quantityPurchased: number;
    quantityRemaining: number;

    costPrice: number;
    sellingPrice?: number;
    totalCost: number;

    vendorName: string;
    vendorContact?: string;
    purchasePurpose: string;

    itemCategory: string;
    itemStatus: "low stock" | "in stock" | "out of stock";

    inventoryMonth: string;
    inventoryYear: string;
    createdAt: Date;
}

const InventorySchema = new Schema<IInventory>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },

        itemName: { type: String, required: true },
        itemSKU: { type: String, required: true, uppercase: true },

        quantityPurchased: { type: Number, required: true, min: 1 },
        quantityRemaining: { type: Number, required: true },

        costPrice: { type: Number, required: true },
        sellingPrice: { type: Number },
        totalCost: { type: Number },

        vendorName: { type: String, required: true },
        vendorContact: { type: String },

        purchasePurpose: { type: String, required: true },
        itemCategory: { type: String, required: true },

        itemStatus: {
            type: String,
            enum: ["low stock", "in stock", "out of stock"],
            default: "in stock",
        },

        inventoryMonth: String,
        inventoryYear: String,
    },
    { timestamps: true }
);

/**
 * Auto calculations before save
 */
InventorySchema.pre("save", function (next) {
    const now = new Date();

    this.inventoryMonth = now.toLocaleString("default", { month: "long" });
    this.inventoryYear = now.getFullYear().toString();

    this.totalCost = this.quantityPurchased * this.costPrice;
    this.quantityRemaining = this.quantityRemaining ?? this.quantityPurchased;

    if (this.quantityRemaining === 0) this.itemStatus = "out of stock";
    else if (this.quantityRemaining < 5) this.itemStatus = "low stock";
    else this.itemStatus = "in stock";

    next();
});

InventorySchema.index({ userId: 1, itemSKU: 1 }, { unique: true });

export default mongoose.model<IInventory>("Inventory", InventorySchema);
