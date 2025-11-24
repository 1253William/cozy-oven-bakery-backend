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
 *               selectOptions:
 *                  type: array
 *                  items:
 *                   type: object
 *                   properties:
 *                    label:
 *                     type: string
 *                     example: "Size"
 *                    additionalPrice:
 *                     type: number
 *                     example: 100
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

/**
 * @swagger
 * /api/v1/dashboard/admin/products:
 *   get:
 *     tags:
 *       - Products (Admin)
 *     summary: Fetch all products (Admin only) with pagination, sorting, filtering, and Redis caching. /api/v1/dashboard/admin/products?page=1&limit=20&sortBy=createdAt
 *     description: |
 *       This endpoint allows Admin users to retrieve products with advanced filtering, sorting, and pagination.
 *       Results are cached using Redis for improved performance.
 *
 *       **Features:**
 *       - Pagination: `page`, `limit`
 *       - Sorting: `sortBy`, `order`
 *       - Filtering: `category`
 *       - Redis caching per page/filter/sort
 *
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of items per page
 *
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter products by productCategory
 *
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, price, rating, productName, stockQuantity]
 *           default: createdAt
 *         description: Field to sort by
 *
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sorting order
 *
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 cached:
 *                   type: boolean
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalDocuments:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     hasNextPage:
 *                       type: boolean
 *                     hasPrevPage:
 *                       type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *
 *       400:
 *         description: Unauthorized request
 *       403:
 *         description: Forbidden. Only admins can access this route.
 *       500:
 *         description: Internal server error
 */
//@route GET /api/v1/dashboard/admin/products
//@desc Fetch all products by pagination, optionally sort and filter by category
//@access Private (Admin only)
router.get("/dashboard/admin/products",authMiddleware,  authorizedRoles("Admin"), getAllProductsAdmin);

/**
 * @swagger
 * /api/v1/dashboard/admin/products/{productId}:
 *   get:
 *     tags:
 *       - Products (Admin)
 *     summary: Fetch a single product by ID (Admin only)
 *     description: |
 *       Retrieves detailed information about a product by its ID.
 *       Uses Redis caching for fast response times.
 *       Accessible only by Admin users.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         description: The unique ID of the product.
 *         schema:
 *           type: string
 *           example: "6919bc8033d08c832b87df57"
 *     responses:
 *       200:
 *         description: Product retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Product fetched successfully"
 *                 cached:
 *                   type: boolean
 *                   example: false
 *                 data:
 *                   $ref: "#/components/schemas/Product"
 *       400:
 *         description: Unauthorized — Missing token or invalid request.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Unauthorized"
 *       403:
 *         description: Forbidden — Only Admin can access this resource.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Forbidden: Admin only"
 *       404:
 *         description: Product not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Product not found"
 *       500:
 *         description: Internal Server Error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Internal Server Error"
 */
//@route GET /api/v1/dashboard/admin/products/:id
//@desc Fetch a product item
//@access Private (Admin only)
router.get("/dashboard/admin/products/:productId", authMiddleware,  authorizedRoles("Admin"),  getProductByIdAdmin);

/**
 * @swagger
 * /api/v1/dashboard/admin/products/{productId}:
 *   patch:
 *     summary: Admin updates an existing product
 *     tags:
 *       - Products (Admin)
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Allows an Admin to update a product, including updating product details,
 *       selectOptions, and optionally replacing the product thumbnail image.
 *       This endpoint accepts multipart/form-data for thumbnail uploads.
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         description: The ID of the product to update
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               productName:
 *                 type: string
 *                 example: "Chocolate Cake Deluxe"
 *               productCategory:
 *                 type: string
 *                 example: "Family Size"
 *               productDetails:
 *                 type: string
 *                 example: "Updated rich chocolate taste with bananas"
 *               price:
 *                 type: number
 *                 example: 30
 *               selectOptions:
 *                 type: string
 *                 description: JSON array of select options
 *                 example: |
 *                   [
 *                     {
 *                       "label": "Small",
 *                       "additionalPrice": 25,
 *                       "sku": "CHO-SM123",
 *                       "stockQuantity": 10
 *                     },
 *                     {
 *                       "label": "Large",
 *                       "additionalPrice": 30,
 *                       "sku": "CHO-LG123",
 *                       "stockQuantity": 5
 *                     }
 *                   ]
 *               productThumbnail:
 *                 type: string
 *                 format: binary
 *                 description: Upload a new product thumbnail image (optional)
 *
 *     responses:
 *       200:
 *         description: Product updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Product updated successfully
 *                 data:
 *                   type: object
 *                   description: Updated product object
 *       400:
 *         description: Invalid input or unauthorized request
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal Server Error
 */
//@route PATCH /api/v1/dashboard/admin/products/:id
//@desc Admin edit product item
//@access Private (Admin only)
router.patch("/dashboard/admin/products/:productId", authMiddleware,  authorizedRoles("Admin"), upload.single("thumbnail"),updateProduct);

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
