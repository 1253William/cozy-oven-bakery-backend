// // Wishlist Controller
// import { Request, Response } from "express";
//
//
// export class WishlistController {
//     constructor(private wishlistService: any) {}
//
//
// // Add item to wishlist
//     async addToWishlist(req: Request, res: Response) {
//         try {
//             const userId = req.user.id;
//             const { productId } = req.body;
//
//
//             const item = await this.wishlistService.add(userId, productId);
//             res.status(201).json({ success: true, data: item });
//         } catch (error) {
//             res.status(500).json({ success: false, message: error.message });
//         }
//     }
//
//
// // Get all wishlist items for a user
//     async getWishlist(req: Request, res: Response) {
//         try {
//             const userId = req.user.id;
//             const items = await this.wishlistService.getByUser(userId);
//             res.status(200).json({ success: true, data: items });
//         } catch (error) {
//             res.status(500).json({ success: false, message: error.message });
//         }
//     }
//
//
// // Remove item from wishlist
//     async removeFromWishlist(req: Request, res: Response) {
//         try {
//             const userId = req.user.id;
//             const { productId } = req.params;
//
//
//             await this.wishlistService.remove(userId, productId);
//             res.status(200).json({ success: true, message: "Removed successfully" });
//         } catch (error) {
//             res.status(500).json({ success: false, message: error.message });
//         }
//     }
// }