// import mongoose, { Schema, Document, Model } from "mongoose";
//
// //inventory.model.ts
// export interface IInventory extends Document {
//     userId: mongoose.Types.ObjectId;
//     itemName: string;
//     itemSKU: string;
//     itemQuantity: number;
//     itemPrice?: number;
//     itemCategory: string;
//     itemStatus: "low stock" | "in stock" | "out of stock" | "damaged" | "missing" | "other";
//     date: Date;
//     inventoryMonth: string;
//     inventoryYear: string;
// }
//
// const InventorySchema: Schema<IInventory> = new Schema(
//     {
//         userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
//         itemName: { type: String, required: true, trim: true },
//         itemSKU: { type: String, required: true, unique: true, uppercase: true },
//         itemQuantity: { type: Number, required: true, min: 0 },
//         itemPrice: { type: Number, default: 0 },
//         itemCategory: { type: String, required: true, trim: true },
//         itemStatus: {
//             type: String,
//             enum: ["low stock", "in stock", "out of stock", "damaged", "missing", "other"],
//             default: "in stock",
//         },
//         date: { type: Date, default: Date.now },
//         inventoryMonth: { type: String },
//         inventoryYear: { type: String },
//     },
//     { timestamps: true }
// );
//
// //Middleware: Set month/year before save
// InventorySchema.pre("save", function (next) {
//     const now = new Date();
//     this.inventoryMonth = now.toLocaleString("default", { month: "long" });
//     this.inventoryYear = now.getFullYear().toString();
//
//     //Auto-derive status
//     if (this.itemQuantity === 0) this.itemStatus = "out of stock";
//     else if (this.itemQuantity < 3) this.itemStatus = "low stock";
//     else this.itemStatus = "in stock";
//
//     next();
// });
//
// //Indexes
// InventorySchema.index({ userId: 1, itemSKU: 1 }, { unique: true });
// InventorySchema.index({ itemCategory: 1 });
//
// const InventoryModel: Model<IInventory> = mongoose.model<IInventory>("Inventory", InventorySchema);
// export default InventoryModel;
