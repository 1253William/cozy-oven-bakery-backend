import { Request, Response } from "express";
import ProductModel from "./product.model";
import User from '../account/user.model';
import { generateSKU } from "../../utils/helpers/generateSKU";
import redisClient from '../../config/redis';
import { cloudinaryHelper } from '../../utils/helpers/cloudinaryHelper';
import { AuthRequest } from '../../types/authRequest'

/**************ADMIN PRODUCT CONTROLLERS**********************/
//@route POST /api/v1/dashboard/admin/products/upload
//@desc Admin upload product thumbnail or email
//@access Private (Admin only)
// export const uploadProductThumbnail = async (req: AuthRequest, res: Response): Promise<void> => {
//     try {
//         const userId = req.user?.userId;
//
//         if (!userId) {
//             res.status(400).json({ success: false, message: "Unauthorized" });
//             return;
//         }
//         const user = await User.findById(userId);
//         if (!user || user.role !== "Admin") {
//             res.status(403).json({ success: false, message: "Forbidden: Admin only" });
//             return;
//         }
//
//         if (!req.file) {
//             res.status(400).json({
//                 success: false,
//                 message: "No file uploaded"
//             });
//             return;
//         }
//
//         const result = await cloudinaryHelper.uploadImage(req.file.path, "cozyoven/products_thumbnails");
//         const productThumbnail = await ProductModel.findByIdAndUpdate( { productThumbnail: result.url,  productPublicId: result.publicId, }, { new: true });
//
//
//         // const result = await cloudinary.uploader.upload(req.file.path, {
//         //     folder: "seltra/products",
//         //     resource_type: "image"
//         // });
//
//         res.status(200).json({
//             success: true,
//             message: "Image uploaded successfully",
//             url: result.secure_url,
//             publicId: result.public_id
//         });
//         return;
//
//     } catch (err) {
//         res.status(500).json({
//             success: false,
//             message: "Cloudinary upload failed",
//             error: err
//         });
//         return;
//     }
// };

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
            const {
                productName,
                price,
                productCategory,
                productDetails
            } = req.body;

            //Validate fields
            if (!productName || !price || !productCategory) {
                res.status(400).json({
                    success: false,
                    message: "productName, price, and productCategory are required"
                });
                return;
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
                sku
            });

            //Invalidate cache
            await redisClient.del("products:all");

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

        if (!userId) {
            res.status(400).json({ success: false, message: "Unauthorized" });
            return;
        }
        const user = await User.findById(userId);
        if (!user || user.role !== "Admin") {
            res.status(403).json({ success: false, message: "Forbidden: Admin only" });
            return;
        }

        const cached = await redisClient.get("products:all");

        if (cached) {
            res.status(200).json({ success: true, cached: true, data: JSON.parse(cached) });
            return;
        }

        const products = await ProductModel.find().lean();

        await redisClient.setex("products:all", 60, JSON.stringify(products));

        res.status(200).json({
            success: true,
            data: products,
        });

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

        if (!userId) {
            res.status(400).json({ success: false, message: "Unauthorized" });
            return;
        }
        const user = await User.findById(userId);
        if (!user || user.role !== "Admin") {
            res.status(403).json({ success: false, message: "Forbidden: Admin only" });
            return;
        }
        const { productId } = req.params;

        const cacheKey = `product:${productId}`;
        const cached = await redisClient.get(cacheKey);

        if (cached) {
            res.status(200).json({ success: true, cached: true, data: JSON.parse(cached) });
            return;
        }

        const product = await ProductModel.findById(productId);

        if (!product) {
            res.status(404).json({ success: false, message: "Product not found" });
            return;
        }

        await redisClient.setex(cacheKey, 120, JSON.stringify(product));

        res.status(200).json({ success: true, data: product });
    } catch (error) {
        console.error("Error fetching product", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
        return;
    }
};

//@route PATCH /api/v1/dashboard/admin/products/:id
//@desc Admin edit product item
//@access Private (Admin only)
export const updateProduct = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            res.status(400).json({ success: false, message: "Unauthorized" });
            return;
        }
        const user = await User.findById(userId);
        if (!user || user.role !== "Admin") {
            res.status(403).json({ success: false, message: "Forbidden: Admin only" });
            return;
        }
        const { productId } = req.params;

        const product = await ProductModel.findById(productId);
        if (!product) {
            res.status(404).json({ success: false, message: "Product not found" });
            return;
        }
        // Switch updateProduct to the safe two-step approach (upload new image first, then delete old), and provide that version
        // If a file is uploaded, replace existing image
        if ((req as any).file) {
            // delete old image if present
            if (product.productPublicId) {
                try {
                    await cloudinaryHelper.deleteFile(product.productPublicId);
                } catch (err) {
                    // log but don't block update (you may choose to surface error)
                    console.warn("Failed to delete old Cloudinary file:", err);
                }
            }
            const upload = await cloudinaryHelper.uploadImage((req as any).file.path, "cozyoven/products_thumbnails");
            req.body.productThumbnail = upload.url;
            req.body.productPublicId = upload.publicId;
        }

        // If productThumbnail provided as URL (no file) and different publicId is provided, update fields too.
        // Merge req.body into product and save
        Object.assign(product, req.body);
        await product.save();

        // invalidate caches
        await redisClient.del("products:all");
        await redisClient.del(`product:${productId}`);

        res.status(200).json({
            success: true,
            message: "Product updated successfully",
            data: product
        });

    } catch (error) {
        console.error("Error updating product", error);
        res.status(500).json({ success: false, message: "Internal server error" });
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
        const user = await User.findById(userId);
        if (!user || user.role !== "Admin") {
            res.status(403).json({ success: false, message: "Forbidden: Admin only" });
            return;
        }
        const { productId } = req.params;

        const product = await ProductModel.findById(productId);
        if (!product) {
            res.status(404).json({ success: false, message: "Product not found" });
            return;
        }

        // delete image from Cloudinary if exists
        if (product.productPublicId) {
            try {
                await cloudinaryHelper.deleteFile(product.productPublicId);
            } catch (err) {
                console.warn("Cloudinary delete failed:", err);
                // proceed with deletion of db record to avoid orphaned app state
            }
        }

        await product.deleteOne();

        // invalidate caches
        await redisClient.del("products:all");
        await redisClient.del(`product:${productId}`);

        res.status(200).json({
            success: true,
            message: "Product deleted successfully",
        });
        return;

    } catch (error) {
        console.error("Error deleting product", error);
        res.status(500).json({ success: false, message: "Internal server error" });
        return;
    }
};


/**************CUSTOMER PRODUCT CONTROLLERS**********************/
//@route GET /api/v1/store/customer/products
//@desc Fetch all products, optionally sort and filter by category
//@access Public (Customer)
export const getAllProductsCustomer = async (req: Request, res: Response): Promise<void> => {
    try {

        let cached = await redisClient.get("products:all");

        if (!cached) {
            const products = await ProductModel.find().lean();
            await redisClient.setex("products:all", 60, JSON.stringify(products));
            res.status(200).json({
                success: true,
                message: "All products fetched successfully for customer",
                data: products,
            });
        } else {
            res.status(200).json(
                {
                 success: true,
                 cached: true,
                 data: JSON.parse(cached)});
            return;
        }
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

        let cacheKey: string;
        cacheKey = `product:${productId}`;
        const [cached] = await Promise.all([redisClient.get(cacheKey)]);

        if (!cached) {
            const [product] = await Promise.all([ProductModel.findById(productId)]);
            if (!product) {
                res.status(404).json(
                    {
                        success: false,
                        message: "Product not found"});
                return;
            }
            await redisClient.setex(cacheKey, 120, JSON.stringify(product));

            res.status(200).json(
                {
                    success: true,
                    message: "Product fetched successfully for customer",
                    data: product
                });
        } else {
            res.status(200).json(
                {
                    success: true,
                    cached: true,
                    data: JSON.parse(cached)
                });
            return;
        }

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