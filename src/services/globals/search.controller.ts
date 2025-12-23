import { Response } from 'express';
import { AuthRequest } from "../../types/authRequest";
import ProductModel from "../products/product.model";

//Global Search API – searches across multiple collections/models in system (tasks, employees, etc.).
//Context Search API – narrower search, restricted to a specific context (e.g., only employees, or only tasks, depending on context parameter).


//@route GET /api/v1/search/products?query=Quadruple Flight Box
//@desc Public search for products (landing page search)
//@access Public
export const searchProducts = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { query } = req.query;

        if (!query || typeof query !== "string") {
            res.status(400).json({
                success: false,
                message: "Missing or Invalid Query parameter is required"
            });
            return;
        }

        const products = await ProductModel.find(
            {
                isAvailable: true,
                $text: { $search: query }
            },
            {
                score: { $meta: "textScore" }
            }
        )
            .sort({ score: { $meta: "textScore" }, rating: -1 })
            .limit(10)
            .select(
                "productName price productThumbnail productCategory"
            )
            .lean();

        if (products.length === 0) {
            res.status(200).json({
                success: true,
                message: "No search found",
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Search found",
            data: products
        });
        return;

    } catch (error) {
        console.error("Product search error:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
        return;
    }
};

