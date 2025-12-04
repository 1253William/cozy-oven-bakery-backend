import { Request, Response } from "express";
import ProductModel from "./product.model";
import User from '../account/user.model';
import { generateSKU } from "../../utils/helpers/generateSKU";
import redisClient from '../../config/redis';
import { cloudinaryHelper } from '../../utils/helpers/cloudinaryHelper';
import {withTimeout} from "../../utils/helpers/timeOut";
import { AuthRequest } from '../../types/authRequest'

/**************ADMIN PRODUCT CONTROLLERS**********************/
//@route POST /api/v1/dashboard/admin/products
//@desc  Admin creates a new product (with thumbnail upload)
//@access Private (Admin only)
export const createProduct = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        let userId = req.user?.userId;

        if (userId) {
            const user = await User.findById(userId);
            if (!user || user.role !== "Admin") {
                res.status(403).json({success: false, message: "Forbidden: Admin only"});
                return;
            }
            let {
                productName,
                price,
                productCategory,
                productDetails,
            } = req.body;

            //Validate fields
            if (!productName || !productCategory || !productDetails) {
                res.status(400).json({
                    success: false,
                    message: "Product Name, Product Category and Product Details are required"
                });
                return;
            }

            let selectOptions = [];
            if (req.body.selectOptions) {
                selectOptions = JSON.parse(req.body.selectOptions);
            }

            //If selectOptions was added, use its additionalPrice the least price as the price of the base product (price)
            if (selectOptions.length > 0) {
                let leastPrice = selectOptions[0].additionalPrice;
                for (let i = 1; i < selectOptions.length; i++) {
                    if (selectOptions[i].additionalPrice < leastPrice) {
                        leastPrice = selectOptions[i].additionalPrice;
                    }
                }
                price = leastPrice;
            }

            if (!req.file) {
            res.status(400).json({
                success: false,
                message: "Product thumbnail is required"
            });
            return;
            }
            //Upload thumbnail to Cloudinary
            const uploadResult = await cloudinaryHelper.uploadImage(
                req.file.path, "cozyoven/products_thumbnails"
            );

            const thumbnailUrl = uploadResult.url;
            const publicId = uploadResult.publicId;

            if (!thumbnailUrl) {
                res.status(500).json({
                    success: false,
                    message: "Thumbnail upload failed"
                });
                return;
            }

            const sku = generateSKU(productName);

            const product = await ProductModel.create({
                productName,
                productCategory,
                productThumbnail: thumbnailUrl,
                productPublicId: publicId,
                productDetails,
                price,
                sku,
                selectOptions: selectOptions
            });

            // //Invalidate cache
            // try {
            //     await redisClient.del("products:all");
            // } catch (err) {
            //     console.warn("Redis delete failed:", err);
            // }

            res.status(201).json({
                success: true,
                message: "Product created successfully",
                data: product
            });
            return;

        } else {
            res.status(400).json({success: false, message: "Unauthorized"});
            return;
        }

    } catch (error) {
        console.error("Error creating product:", error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
        return;
    }
};


//@route GET /api/v1/dashboard/admin/products
//@desc Fetch all products, optionally sort and filter by category
//@access Private (Admin only)
export const getAllProductsAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const user = await User.findById(userId);
        if (!user) {
            res.status(400).json({ success: false, message: "Unauthorized: Admin only" });
            return;
        }

        //Pagination, Sorting and Filtering
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;
        const skip = (page-1) * limit;

        const category = req.query.category as string;
        const sortBy = (req.query.sortBy as string) || "createdAt";
        const order = (req.query.order as string ) === "asc" ? 1 : -1

        const query: Record<string, unknown> = { };
        if(category) query.productCategory = category;

        //Redis cache
        const redisKey = `products:admin:page:${page}:limit:${limit}:cat:${category || "all"}:sort:${sortBy}:${order}`;

        // const cachedData = await redisClient.get(redisKey);
        // let cachedData: string | null = null;
        // try {
        //     cachedData = await redisClient.get(redisKey);
        // } catch (err) {
        //     console.warn("Redis get failed, bypassing cache:", err);
        // }
        //
        // if (cachedData) {
        //     res.status(200).json({ success: true, cached: true, data: JSON.parse(cachedData) });
        //     return;
        // }

        //DB Query (O(N))
        const products = await ProductModel.find(query)
            .sort({ [sortBy]: order })
            .skip(skip)
            .limit(limit)
            .select("-__v")
            .lean();
        if(!products || products.length === 0) {
            res.status(404).json({ success: false, message: "No products found" });
            return;
        }

        //Fast count for pagination metadata
        const totalDocuments = await ProductModel.countDocuments(query);
        const totalPages = Math.ceil(totalDocuments / limit);

        const responsePayload = {
            success: true,
            cached: false,
            message: "Products fetched successfully",
            pagination: {
                page,
                limit,
                totalDocuments,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            },
            data: products
        };
        //Cache result (short expiry)
        // await redisClient.setex(redisKey, 60, JSON.stringify(responsePayload));
        // try {
        //     await redisClient.setex(redisKey, 60, JSON.stringify(responsePayload));
        // } catch (err) {
        //     console.warn("Redis set failed:", err);
        // }

        res.status(200).json(responsePayload);
        return;

    } catch (error) {
        console.error("Error getting products", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
        return;
    }
};


//@route GET /api/v1/dashboard/admin/products/:id
//@desc Fetch a product item
//@access Private (Admin only)
export const getProductByIdAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const user = await User.findById(userId);
        if (!user) {
            res.status(400).json({ success: false, message: "Unauthorized: Admin only" });
            return;
        }

        const { productId } = req.params;
        const cacheKey = `product:${productId}`;
        //
        // const start = performance.now();
        //
        // let cachedBuffer: Buffer | null = null;
        // try {
        //     cachedBuffer = await redisClient.getBuffer(cacheKey);
        // } catch (err) {
        //     console.warn("Redis getBuffer failed, bypassing cache:", err);
        // }


        // if (cachedBuffer) {
        //     const product = JSON.parse(cachedBuffer.toString());
        //     const end = performance.now();
        //     res.status(200).json({
        //         success: true,
        //         message: "Product fetched (cache)",
        //         cached: true,
        //         cacheResponseTimeMs: Math.round(end - start),
        //         data: product
        //     });
        //     return;
        // }

        const product = await ProductModel.findById(productId).lean()
            .select("-__v");
        if (!product) {
            res.status(404).json({ success: false, message: "Product not found" });
            return;
        }
        //
        // try {
        //     await redisClient.setex(cacheKey, 120, JSON.stringify(product));
        // } catch (err) {
        //     console.warn("Redis set failed:", err);
        // }
        // const end = performance.now();

        res.status(200).json({
            success: true,
            message: "Product fetched successfully (DB)",
            cached: false,
            data: product
        });
        return;

    } catch (error) {
        console.error("Error fetching product", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
        return;
    }
};


//@route PATCH /api/v1/dashboard/admin/products/:id
//@desc Admin edit product item (with safe thumbnail replacement)
//@access Private (Admin only)
export const updateProduct = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const user = await withTimeout(
            User.findById(userId).select("role"),
            5000
        );

        if (!user || user.role !== "Admin") {
            res.status(403).json({ success: false, message: "Unauthorized: Admin only" });
            return;
        }

        const { productId } = req.params;
        console.log("updating product: ", productId);

        const product = await withTimeout(
            ProductModel.findById(productId),
            5000
        );

        if (!product) {
            res.status(404).json({ success: false, message: "Product not found" });
            return;
        }

        const {
            productName,
            productCategory,
            productDetails,
            price
        } = req.body;

        let selectOptions = product.selectOptions;

        if (req.body.selectOptions) {
            try {
                selectOptions = JSON.parse(req.body.selectOptions);

                if (Array.isArray(selectOptions) && selectOptions.length > 0 && selectOptions[0]?.additionalPrice !== undefined) {
                    let leastPrice = selectOptions[0].additionalPrice;
                    for (let i = 1; i < selectOptions.length; i++) {
                        const option = selectOptions[i];
                        if (option?.additionalPrice !== undefined && option.additionalPrice < leastPrice) {
                            leastPrice = option.additionalPrice;
                        }
                    }
                    product.price = leastPrice;
                }

            } catch (err) {
                res.status(400).json({
                    success: false,
                    message: "Invalid selectOptions format (must be JSON array)"
                });
                return;
            }
        }

        if (req.file) {
            try {
                const upload = await withTimeout(
                    cloudinaryHelper.uploadImage(
                        req.file.path,
                        "cozyoven/products_thumbnails"
                    ),
                    10000
                );

                if (!upload?.url) {
                    res.status(500).json({ success: false, message: "Thumbnail upload failed" });
                    return;
                }

                const oldPublicId = product.productPublicId;

                product.productThumbnail = upload.url;
                product.productPublicId = upload.publicId;

                if (oldPublicId) {
                    try {
                        await withTimeout(
                            cloudinaryHelper.deleteFile(oldPublicId),
                            5000
                        );
                    } catch (err) {
                        console.warn("Cloudinary delete error:", err);
                    }
                }

            } catch (err) {
                console.error("Thumbnail update error:", err);
                res.status(500).json({ success: false, message: "Failed to update thumbnail" });
                return;
            }
        }

        if (productName) {
            product.productName = productName;
            product.sku = generateSKU(productName);
        }

        if (productCategory) product.productCategory = productCategory;
        if (productDetails) product.productDetails = productDetails;

        if (!req.body.selectOptions && price !== undefined) {
            product.price = price;
        }

        if (req.body.selectOptions) {
            product.selectOptions = selectOptions;
        }

        await withTimeout(product.save(), 8000);

        try {
            await withTimeout(redisClient.del("products:all"), 3000);
            await withTimeout(redisClient.del(`product:${productId}`), 3000);
        } catch (err) {
            console.warn("Redis delete failed:", err);
        }

        res.status(200).json({
            success: true,
            message: "Product updated successfully",
            data: product
        });
        return;

    } catch (error: any) {
        console.error("Error updating product", error);

        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: error.message
            });
        }
        return;
    }
};


//@route DELETE /api/v1/dashboard/admin/products/:id
//@desc Delete product item
//@access Private (Admin only)
export const deleteProduct = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(400).json({ success: false, message: "Unauthorized" });
            return;
        }

        const user = await withTimeout(
            User.findById(userId),
            5000
        );

        if (!user || user.role !== "Admin") {
            res.status(403).json({ success: false, message: "Forbidden: Admin only" });
            return;
        }

        const { productId } = req.params;

        const product = await withTimeout(
            ProductModel.findById(productId),
            5000
        );

        if (!product) {
            res.status(404).json({ success: false, message: "Product not found" });
            return;
        }

        if (product.productPublicId) {
            try {
                await withTimeout(
                    cloudinaryHelper.deleteFile(product.productPublicId),
                    5000
                );
            } catch (err) {
                console.warn("Cloudinary delete failed:", err);
            }
        }

        await withTimeout(product.deleteOne(), 8000);

        // try {
        //     await withTimeout(redisClient.del("products:all"), 3000);
        //     await withTimeout(redisClient.del(`product:${productId}`), 3000);
        // } catch (err) {
        //     console.warn("Redis delete failed:", err);
        // }

        res.status(200).json({
            success: true,
            message: "Product deleted successfully"
        });
        return;

    } catch (error: any) {
        console.error("Error deleting product", error);

        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: error.message
            });
        }
        return;
    }
};


/**************CUSTOMER PRODUCT CONTROLLERS**********************/
//@route GET /api/v1/store/customer/products
//@desc Fetch all products, optionally sort and filter by category
//@access Public (Customer)
export const getAllProductsCustomer = async (req: Request, res: Response): Promise<void> => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;
        const skip = (page-1) * limit;

        const category = req.query.category as string;
        const sortBy = (req.query.sortBy as string) || "createdAt";
        const order = (req.query.order as string ) === "asc" ? 1 : -1

        const query: Record<string, unknown> = { };
        if(category) query.productCategory = category;

        //DB Query (O(N))
        const getProducts = await ProductModel.find(query)
            .sort({ [sortBy]: order })
            .skip(skip)
            .limit(limit)
            .select("-__v")
            .lean();
        if(!getProducts || getProducts.length === 0) {
            res.status(404).json({ success: false, message: "No products found" });
            return;
        }

        //Fast count for pagination metadata
        const totalDocuments = await ProductModel.countDocuments(query);
        const totalPages = Math.ceil(totalDocuments / limit);

        const responsePayload = {
            success: true,
            cached: false,
            message: "Products fetched successfully",
            pagination: {
                page,
                limit,
                totalDocuments,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            },
            data: getProducts
        };

        res.status(200).json(responsePayload);
        return;

        // let cached = await redisClient.get("products:all");
        //
        // if (!cached) {
        //     const products = await ProductModel.find().lean();
        //     await redisClient.setex("products:all", 60, JSON.stringify(products));
        //     res.status(200).json({
        //         success: true,
        //         message: "All products fetched successfully for customer",
        //         data: products,
        //     });
        // } else {
        //     res.status(200).json(
        //         {
        //          success: true,
        //          cached: true,
        //          data: JSON.parse(cached)});
        //     return;
        // }
    } catch (error) {
        console.error("Error getting products:", error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
        return;
    }
};


//@route GET /api/v1/store/customer/products/:id
//@desc Fetch a product item
//@access Public (Customer)
export const getProductByIdCustomer = async (req: Request, res: Response): Promise<void> => {
    try {
        let productId: string;
        ({productId} = req.params);
        const product = await ProductModel.findById(productId);
        if (!product) {
          res.status(404).json(
          {
         success: false,
           message: "Product not found"});
        return;
           }

        res.status(200).json({
                success: true,
                message: "Product fetched successfully for customer",
                data: product
            }
        )
        return

    } catch (error) {
        console.error("Error getting product:", error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
        return;
    }
};


// ===============================
// Search & Filter (Admin & Customer)
// ===============================
//@route GET /api/v1/store/search?
//@desc Search products
//@access Public (Customer)
export const searchProducts = async (req: Request, res: Response): Promise<void> => {
    try {
        const { q, category, minPrice, maxPrice, sort } = req.query;

        const filter: any = {};

        if (q) filter.$text = { $search: q as string };
        if (category) filter.productCategory = category;
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = Number(minPrice);
            if (maxPrice) filter.price.$lte = Number(maxPrice);
        }

        let query = ProductModel.find(filter);

        if (sort === "price_asc") query = query.sort({ price: 1 });
        if (sort === "price_desc") query = query.sort({ price: -1 });
        if (sort === "rating") query = query.sort({ rating: -1 });

        const results = await query.lean();

        res.status(200).json(
            {
              success: true,
              message: "Products search found successfully",
              data: results
            });

    } catch (error) {
        console.error("Error searching keyword:", error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
        return;
    }
};