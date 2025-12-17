import express from 'express';
import { authMiddleware } from "../../middlewares/authentication.middleware";
import { authorizedRoles } from "../../middlewares/roles.middleware";
import {
    createInventoryPurchase,
    getAllInventoryItems,
    getInventoryItem,
    editInventoryItem,
    deleteInventoryItem,
} from "./inventory.controller";


const router = express.Router();

/**
 * @swagger
 * /api/v1/dashboard/admin/inventory:
 *   post:
 *     summary: Record a new inventory purchase
 *     description: |
 *       Allows an **Admin** to record a new inventory purchase.
 *       This represents items bought from a vendor for bakery operations.
 *       The system will:
 *       - Auto-generate a SKU from the item name
 *       - Calculate total cost internally
 *       - Track remaining quantity
 *       - Assign inventory month and year automatically
 *       - Auto-set stock status based on remaining quantity
 *     tags:
 *       - Inventory (Admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - itemName
 *               - quantityPurchased
 *               - costPrice
 *               - vendorName
 *               - purchasePurpose
 *               - itemCategory
 *             properties:
 *               itemName:
 *                 type: string
 *                 example: "Bread Flour"
 *               quantityPurchased:
 *                 type: number
 *                 example: 10
 *               costPrice:
 *                 type: number
 *                 example: 180
 *                 description: Cost price per unit paid to the vendor
 *               sellingPrice:
 *                 type: number
 *                 example: 300
 *                 description: Optional estimated selling price per unit
 *               vendorName:
 *                 type: string
 *                 example: "Golden Mills Ltd"
 *               vendorContact:
 *                 type: string
 *                 example: "0241234567"
 *               purchasePurpose:
 *                 type: string
 *                 example: "Weekly bread production"
 *               itemCategory:
 *                 type: string
 *                 example: "Raw Materials"
 *     responses:
 *       201:
 *         description: Inventory purchase recorded successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Inventory purchase recorded successfully"
 *               data:
 *                 _id: "672f3f4ca3b1..."
 *                 itemName: "Bread Flour"
 *                 itemSKU: "BREAD-FLOUR-001"
 *                 quantityPurchased: 10
 *                 quantityRemaining: 10
 *                 costPrice: 180
 *                 totalCost: 1800
 *                 vendorName: "Golden Mills Ltd"
 *                 purchasePurpose: "Weekly bread production"
 *                 itemStatus: "in stock"
 *                 inventoryMonth: "January"
 *                 inventoryYear: "2025"
 *       401:
 *         description: Unauthorized – Authentication required
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Unauthorized: Authentication required"
 *       409:
 *         description: Inventory item with generated SKU already exists
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Inventory item already exists"
 *       500:
 *         description: Internal server error
 */
//@route POST /api/v1/dashboard/admin/inventory
//@desc Admin creates a new inventory item (initial POST request)
//@access Private (Admin only)
router.post('/admin/inventory', authMiddleware, authorizedRoles("Admin"), createInventoryPurchase);

/**
 * @swagger
 * /api/v1/dashboard/admin/inventory:
 *   get:
 *     summary: Fetch all inventory items
 *     description: |
 *       Retrieves a paginated list of all inventory items.
 *       Admins can filter by category, status, or search by name/SKU.
 *     tags:
 *       - Inventory (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by item category.
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [low stock, in stock, out of stock, damaged, missing, other]
 *         description: Filter by stock status.
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search items by name or SKU.
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *         description: Page number for pagination.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 10
 *         description: Number of items per page.
 *     responses:
 *       200:
 *         description: Inventory fetched successfully.
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Inventory fetched successfully"
 *               total: 3
 *               page: 1
 *               data:
 *                 - _id: "672f3f4ca3b1..."
 *                   itemName: "HP Laptop"
 *                   itemStatus: "in stock"
 *                   itemQuantity: 25
 *                   itemCategory: "Electronics"
 *       401:
 *         description: Unauthorized.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Unauthorized"
 *       500:
 *         description: Server error fetching inventory.
 */
//@route GET /api/v1/dashboard/admin/inventory
//@desc Fetch all inventory items
//@access Private (Admin only)
router.get("/admin/inventory", authMiddleware, authorizedRoles("Admin"), getAllInventoryItems);

/**
 * @swagger
 * /api/v1/dashboard/admin/inventory/{id}:
 *   get:
 *     summary: Fetch a single inventory item
 *     description: |
 *       Fetches the details of a specific inventory item by its unique ID.
 *       Accessible only to Admin users.
 *     tags:
 *       - Inventory (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Inventory item ID.
 *     responses:
 *       200:
 *         description: Item retrieved successfully.
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 _id: "672f3f4ca3b1..."
 *                 itemName: "HP Laptop"
 *                 itemQuantity: 25
 *                 itemCategory: "Electronics"
 *       404:
 *         description: Item not found.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Item not found"
 *       401:
 *         description: Unauthorized access.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Unauthorized"
 *       500:
 *         description: Server error.
 */
//@route GET /api/v1/dashboard/admin/inventory/:id
//@desc Fetch an inventory item
//@access Private (Admin only)
router.get("/admin/inventory/:id", authMiddleware, authorizedRoles("Admin"), getInventoryItem);

/**
 * @swagger
 * /api/v1/dashboard/admin/inventory/{id}:
 *   put:
 *     summary: Update an inventory item
 *     description: |
 *       Allows an **Admin** to update an existing inventory record.
 *       Supports updates to item quantity, price, category, and status.
 *     tags:
 *       - Inventory (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Inventory item ID.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               itemName:
 *                 type: string
 *                 example: "HP Envy Laptop"
 *               itemQuantity:
 *                 type: number
 *                 example: 18
 *               itemPrice:
 *                 type: number
 *                 example: 970.00
 *               itemStatus:
 *                 type: string
 *                 enum: [low stock, in stock, out of stock, damaged, missing, other]
 *     responses:
 *       200:
 *         description: Item updated successfully.
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Item updated successfully"
 *               data:
 *                 _id: "672f3f4ca3b1..."
 *                 itemName: "HP Envy Laptop"
 *                 itemQuantity: 18
 *       400:
 *         description: Invalid or missing fields.
 *       404:
 *         description: Item not found.
 *       500:
 *         description: Server error while updating.
 */
//@route PUT /api/v1/dashboard/admin/inventory/:id
//@desc Admin edits an inventory item
//@access Private (Admin only)
router.put("/admin/inventory/:id", authMiddleware, authorizedRoles("Admin"), editInventoryItem);

/**
 * @swagger
 * /api/v1/dashboard/admin/inventory/{id}:
 *   delete:
 *     summary: Delete an inventory item
 *     description: |
 *       Permanently deletes an inventory item by its ID.
 *       Only Admin users can perform this operation.
 *     tags:
 *       - Inventory (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Inventory item ID.
 *     responses:
 *       200:
 *         description: Item deleted successfully.
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Item deleted successfully"
 *       401:
 *         description: Unauthorized.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Unauthorized"
 *       403:
 *         description: Forbidden — Only Admins can delete inventory items.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Forbidden: Only Admin can access this route"
 *       404:
 *         description: Item not found.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Item not found"
 *       500:
 *         description: Server error deleting item.
 */
//@route DELETE /api/v1/dashboard/admin/inventory/:id
//@desc Delete an inventory item
//@access Private (Admin only)
router.delete("/admin/inventory/:id", authMiddleware, authorizedRoles("Admin"), deleteInventoryItem);

export default router;