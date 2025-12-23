import express from "express";
import { searchProducts } from "./search.controller";

const router = express.Router();

/**
 * @swagger
 * /api/v1/search/products?query=Quadruple Flight Box:
 *   get:
 *     tags:
 *       - Search (Global)
 *     summary: Search products (Public)
 *     description: |
 *       Public search endpoint for products, used on the website landing page header.
 *       Searches available products by keyword using full-text search on product name and details.
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         description: Keyword to search for products (e.g. product name or description)
 *         schema:
 *           type: string
 *           example: "Quadruple Flight Box"
 *     responses:
 *       200:
 *         description: Search found
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
 *                   example: "Search found"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "675f0f1b8b2f34a1e8c12345"
 *                       productName:
 *                         type: string
 *                         example: "Quadruple Flight Box - 4"
 *                       price:
 *                         type: number
 *                         example: 0.1
 *                       productThumbnail:
 *                         type: string
 *                         example: "https://res.cloudinary.com/dfmsaarli/image/upload/..."
 *                       productCategory:
 *                         type: string
 *                         example: "Fruits"
 *       400:
 *         description: Missing or invalid query parameter
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
 *                   example: "Query parameter is required"
 *       500:
 *         description: Internal server error
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
//@route GET /api/v1/search/products?query
//@desc Public search for products (landing page search)
//@access Public
router.get('/products', searchProducts);

export default router;

