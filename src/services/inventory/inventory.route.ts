import express from 'express';
import { authMiddleware } from "../../middlewares/authentication.middleware";
import { authorizedRoles } from "../../middlewares/roles.middleware";
import {
    createNewInventoryItem,
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
 *     summary: Create a new inventory item
 *     description: |
 *       Allows an **Admin** to create a new inventory record with details such as item name, SKU, quantity, category, and price.
 *       The system automatically sets the inventory month, year, and stock status based on quantity.
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
 *               - itemSKU
 *               - itemQuantity
 *               - itemCategory
 *             properties:
 *               itemName:
 *                 type: string
 *                 example: "HP Laptop"
 *               itemSKU:
 *                 type: string
 *                 example: "HP-ENVY-15"
 *               itemQuantity:
 *                 type: number
 *                 example: 25
 *               itemPrice:
 *                 type: number
 *                 example: 950.00
 *               itemCategory:
 *                 type: string
 *                 example: "Electronics"
 *     responses:
 *       201:
 *         description: Inventory item created successfully.
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Item created successfully"
 *               data:
 *                 _id: "672f3f4ca3b1..."
 *                 itemName: "HP Laptop"
 *                 itemStatus: "in stock"
 *       400:
 *         description: Missing required fields.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Missing required fields"
 *       403:
 *         description: Forbidden — Only Admins can create items.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Forbidden: Only Admin can create items"
 *       409:
 *         description: Duplicate SKU conflict.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Item with this SKU already exists"
 *       500:
 *         description: Server error.
 */
//@route POST /api/v1/dashboard/admin/inventory
//@desc Admin creates a new inventory item (initial POST request)
//@access Private (Admin only)
router.post('/admin/inventory', authMiddleware, authorizedRoles("Admin"), createNewInventoryItem);

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
 *       Accessible only to Admin account.
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
 *       Only Admin account can perform this operation.
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