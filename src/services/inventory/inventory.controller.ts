// import { Response } from 'express';
// import { AuthRequest } from "../../types/authRequest";
// import InventoryModel from './inventory.model';
// import User from '../account/user.model';
//
//
// //@route POST /api/v1/dashboard/admin/inventory
// //@desc Admin creates a new inventory item (initial POST request)
// //@access Private (Admin only)
// export const createNewInventoryItem = async (req: AuthRequest, res: Response): Promise<void> => {
//     try {
//         const userId = req.user?.userId;
//         if (!userId) {
//             res.status(401).json({ success: false, message: "Unauthorized" });
//             return;
//         }
//
//         //Find the user role to be only admin if not deny access
//         const currentUser = await User.findById(userId);
//         if (!currentUser) {
//             res.status(404).json({ success: false, message: "User not found" });
//             return;
//         }
//         if (currentUser.role !== 'Admin') {
//             res.status(403).json({ success: false, message: "Forbidden: Only Admin can create inventory items" });
//             return;
//         }
//
//         const { itemName, itemSKU, itemQuantity, itemPrice, itemCategory } = req.body;
//         if (!itemName || !itemSKU || !itemQuantity || !itemCategory) {
//             res.status(400).json({ success: false, message: "Missing required fields" });
//             return;
//         }
//
//         //Verify item exist
//         const validItem = await InventoryModel.findOne({ itemSKU });
//         if (validItem) {
//             res.status(400).json({ success: false, message: "Item already exists" });
//             return;
//         }
//
//         //Create the item
//         const inventory = await InventoryModel.create({
//             userId: userId,
//             itemName,
//             itemSKU,
//             itemQuantity,
//             itemPrice,
//             itemCategory
//         });
//
//         res.status(201).json({
//             success: true,
//             message: "Inventory item created successfully",
//             data: inventory
//         });
//         return ;
//
//     } catch (error: any) {
//         if (error.code === 11000) {
//             res.status(400).json({
//                 success: false,
//                 message: "This inventory item has already been created. Please use the update route to update the existing item.",
//                 error: error.keyValue,
//             });
//             return;
//         }
//         console.error("Error creating inventory item:", error);
//         res.status(500).json({ success: false, message: "Error creating inventory item", error });
//         return
//     }
// };
//
// //@route PUT /api/v1/dashboard/admin/inventory/:id
// //@desc Admin edits an inventory item
// //@access Private (Admin only)
// export const editInventoryItem = async (req: AuthRequest, res: Response): Promise<void> => {
//     try {
//         const userId = req.user?.userId;
//         if (!userId) {
//             res.status(401).json({ success: false, message: "Unauthorized" });
//             return;
//         }
//         const updates = req.body;
//         const { id } = req.params;
//
//         const inventory = await InventoryModel.findByIdAndUpdate(id,updates, { new: true, runValidators: true });
//         if (!inventory) {
//             res.status(404).json({ success: false, message: "Inventory item not found" });
//             return;
//         }
//
//         res.status(200).json({
//             success: true,
//             message: "Inventory item updated successfully",
//             data: inventory
//         })
//
//     } catch (error) {
//         console.error("Error editing inventory item:", error);
//         res.status(500).json({ success: false, message: "Error editing inventory item", error });
//         return
//     }
// }
//
// //@route GET /api/v1/dashboard/admin/inventory/:id
// //@desc Fetch an inventory item
// //@access Private (Admin only)
// export const getInventoryItem = async (req: AuthRequest, res: Response): Promise<void> => {
//     try {
//         const { id } = req.params;
//         const item = await InventoryModel.findById(id);
//         if (!item) return void res.status(404).json({ success: false, message: "Item not found" });
//
//         res.status(200).json(
//             {
//             success: true,
//             message: "Inventory item has been fetched successfully",
//             data: item
//             });
//
//     } catch (error) {
//         console.error("Error fetching item:", error);
//         res.status(500).json({ success: false, message: "Server error fetching item" });
//     }
// };
//
// //@route GET /api/v1/dashboard/admin/inventory
// //@desc Fetch all inventory items
// //@access Private (Admin only)
// export const getAllInventoryItems = async (req: AuthRequest, res: Response): Promise<void> => {
//     try {
//         const { category, status, search, page = 1, limit = 10 } = req.query;
//
//         const query: any = {};
//         if (category) query.itemCategory = category;
//         if (status) query.itemStatus = status;
//         if (search) query.itemName = { $regex: search, $options: "i" };
//
//         const skip = (+page - 1) * +limit;
//
//         const [items, total] = await Promise.all([
//             InventoryModel.find(query).skip(skip).limit(+limit).sort({ createdAt: -1 }),
//             InventoryModel.countDocuments(query),
//         ]);
//
//         res.status(200).json({
//             success: true,
//             message: "Inventory fetched successfully",
//             total,
//             page: +page,
//             data: items,
//         });
//
//     } catch (error) {
//         console.error("Error fetching inventory:", error);
//         res.status(500).json({ success: false, message: "Server error fetching inventory" });
//     }
// };
//
// //@route DELETE /api/v1/dashboard/admin/inventory/:id
// //@desc Delete an inventory item
// //@access Private (Admin only)
// export const deleteInventoryItem = async (req: AuthRequest, res: Response): Promise<void> => {
//     try {
//         const { id } = req.params;
//         const deleted = await InventoryModel.findByIdAndDelete(id);
//         if (!deleted) return void res.status(404).json({ success: false, message: "Item not found" });
//
//         res.status(200).json({
//             success: true,
//             message: "Item deleted successfully"
//         });
//         return;
//
//     } catch (error) {
//         console.error("Error deleting item:", error);
//         res.status(500).json({ success: false, message: "Server error deleting item" });
//     }
// };
//
//
