import express from "express";
import { authMiddleware } from "../../middlewares/authentication.middleware";
import { authorizedRoles } from "../../middlewares/roles.middleware";
import { upload } from "../../middlewares/upload.middleware";
import {
    createProduct,
    getAllProductsAdmin,
    getProductByIdAdmin,
    updateProduct,
    deleteProduct,
    searchProducts,
    getAllProductsCustomer,
    getProductByIdCustomer,
} from "./product.controller";

const router = express.Router();

//Admin routes
/**
 * @swagger
 * /api/v1/dashboard/admin/products/upload:
 *   post:
 *     tags:
 *       - Products (Admin)
 *     summary: Upload product thumbnail
 *     description: Uploads a product image to Cloudinary and returns the hosted URL.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *       400:
 *         description: Missing file
 *       500:
 *         description: Cloudinary error
 */
//@route POST /api/v1/dashboard/admin/products/upload
//@desc Admin upload product thumbnail or email
//@access Private (Admin only)
// router.post("/dashboard/admin/products/upload", authMiddleware, authorizedRoles("Admin") ,uploadProductThumbnail);

/**
 * @swagger
 * /api/v1/dashboard/admin/products:
 *   post:
 *     tags:
 *       - Products (Admin)
 *     summary: Create a new product
 *     description: Admin only — Admin creates a new product with image upload. Accepts multipart/form-data, auto-generates SKU.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productName
 *               - price
 *               - productCategory
 *               - productThumbnail
 *               - productDetails
 *             properties:
 *               productName:
 *                 type: string
 *                 example: "Family Size Red Velvet Cake"
 *               price:
 *                 type: number
 *                 example: 350
 *               productCategory:
 *                 type: string
 *                 example: "Family Size"
 *               productThumbnail:
 *                 type: string
 *                 example: "https://cloudinary.com/img.png"
 *               productDetails:
 *                 type: string
 *     responses:
 *       201:
 *         description: Product created successfully
 *       403:
 *         description: Forbidden — Admin only
 *       500:
 *         description: Server error
 */
//@route POST /api/v1/dashboard/admin/products
//@desc Admin adds a new product
//@access Private (Admin only)
router.post("/dashboard/admin/products", authMiddleware, authorizedRoles("Admin"), upload.single("thumbnail"), createProduct);

//@route GET /api/v1/dashboard/admin/products
//@desc Fetch all products by pagination, optionally sort and filter by category
//@access Private (Admin only)
router.get("/",authMiddleware,  authorizedRoles("Admin"), getAllProductsAdmin);

//@route GET /api/v1/dashboard/admin/products/:id
//@desc Fetch a product item
//@access Private (Admin only)
router.get("/dashboard/admin/products/:productId", authMiddleware,  authorizedRoles("Admin"),  getProductByIdAdmin);

//@route PATCH /api/v1/dashboard/admin/products/:id
//@desc Admin edit product item
//@access Private (Admin only)
router.patch("/dashboard/admin/products/:productId", authMiddleware,  authorizedRoles("Admin"),updateProduct);

//@route DELETE /api/v1/dashboard/admin/products/:id
//@desc Delete product item
//@access Private (Admin only)
router.delete("/dashboard/admin/products/:productId", authMiddleware, authorizedRoles("Admin"), deleteProduct);

//Customer routes

//@route GET /api/v1/store/customer/products
//@desc Fetch all products by pagination, optionally sort and filter by category
//@access Public (Customer)
router.get("/store/customer/products", getAllProductsCustomer);

//@route GET /api/v1/store/customer/products/:id
//@desc Fetch a product item
//@access Public (Customer)
router.get("/store/customer/products/:productId", getProductByIdCustomer);

//Product Search route
router.get("/search", searchProducts);

export default router;
