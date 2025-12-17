import { Response } from 'express';
import { AuthRequest } from "../../types/authRequest";
import InventoryModel from './inventory.model';
import UserModel from "../account/user.model"
import {generateSKU} from "../../utils/helpers/generateSKU";


//@route POST /api/v1/dashboard/admin/inventory
//@desc Admin creates a new inventory item
//@access Private (Admin only)
export const createInventoryPurchase = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized: Authentication required" });
            return;
        }

        const {
            itemName,
            itemSKU,
            quantityPurchased,
            costPrice,
            sellingPrice,
            vendorName,
            vendorContact,
            purchasePurpose,
            itemCategory,
        } = req.body;

        let productName: any;
        productName = itemName;

        const sku = generateSKU(productName);

        const inventory = await InventoryModel.create({
            userId,
            itemName,
            itemSKU: sku,
            quantityPurchased,
            quantityRemaining: quantityPurchased,
            costPrice,
            sellingPrice,
            vendorName,
            vendorContact,
            purchasePurpose,
            itemCategory,
        });

        res.status(201).json({
            success: true,
            message: "Inventory purchase recorded successfully",
            data: inventory,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to create inventory" });
        return;
    }
};

//@route PUT /api/v1/dashboard/admin/inventory/:id
//@desc Admin edits an inventory item
//@access Private (Admin only)
export const editInventoryItem = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        const updates = req.body;
        const { id } = req.params;

        const inventory = await InventoryModel.findByIdAndUpdate(id,updates, { new: true, runValidators: true });
        if (!inventory) {
            res.status(404).json({ success: false, message: "Inventory item not found" });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Inventory item updated successfully",
            data: inventory
        })

    } catch (error) {
        console.error("Error editing inventory item:", error);
        res.status(500).json({ success: false, message: "Error editing inventory item", error });
        return
    }
}

//@route GET /api/v1/dashboard/admin/inventory/:id
//@desc Fetch an inventory item
//@access Private (Admin only)
export const getInventoryItem = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const item = await InventoryModel.findById(id);
        if (!item) return void res.status(404).json({ success: false, message: "Item not found" });

        res.status(200).json(
            {
                success: true,
                message: "Inventory item has been fetched successfully",
                data: item
            });

    } catch (error) {
        console.error("Error fetching item:", error);
        res.status(500).json({ success: false, message: "Server error fetching item" });
    }
};

//@route GET /api/v1/dashboard/admin/inventory
//@desc Fetch all inventory items
//@access Private (Admin only)
export const getAllInventoryItems = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { category, status, search, page = 1, limit = 10 } = req.query;

        const query: any = {};
        if (category) query.itemCategory = category;
        if (status) query.itemStatus = status;
        if (search) query.itemName = { $regex: search, $options: "i" };

        const skip = (+page - 1) * +limit;

        const [items, total] = await Promise.all([
            InventoryModel.find(query).skip(skip).limit(+limit).sort({ createdAt: -1 }),
            InventoryModel.countDocuments(query),
        ]);

        //Check if there are any items in the inventory
        if(items && total === 0){
            res.status(200).json({
                success: true,
                message: "No items found in inventory",
            })
            return;
        }

        res.status(200).json({
            success: true,
            message: "Inventory fetched successfully",
            total,
            page: +page,
            data: items,
        });

    } catch (error) {
        console.error("Error fetching inventory:", error);
        res.status(500).json({ success: false, message: "Server error fetching inventory" });
    }
};

//@route DELETE /api/v1/dashboard/admin/inventory/:id
//@desc Delete an inventory item
//@access Private (Admin only)
export const deleteInventoryItem = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const deleted = await InventoryModel.findByIdAndDelete(id);
        if (!deleted) return void res.status(404).json({ success: false, message: "Item not found or already deleted" });

        res.status(200).json({
            success: true,
            message: "Item deleted successfully"
        });
        return;

    } catch (error) {
        console.error("Error deleting item:", error);
        res.status(500).json({ success: false, message: "Server error deleting item" });
    }
};

