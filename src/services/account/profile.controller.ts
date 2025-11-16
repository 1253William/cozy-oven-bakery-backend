import {Request, Response} from 'express';
import User from './user.model';
import Order from "../orders/order.model";
import { AuthRequest } from '../../types/authRequest'
// import { cloudinaryHelper } from '../../utils/helpers/cloudinaryHelper';
import bcrypt from "bcryptjs";
import redisClient from '../../config/redis';
require('dotenv').config();

// //@route PATCH /api/v1/settings/profile-image
// //@desc Update logged-in user's profile image
// //@access Private
// export const updateProfilePicture = async (req: AuthRequest, res: Response) => {
//   try {
//      const userId = req.user?.userId;
//
//         if (!userId) {
//             res.status(400).json({ success: false, message: "Unauthorized" });
//             return;
//         }
//
//         const user = await User.findById(userId);
//         if (!user) {
//             res.status(404).json({ success: false, message: "User not found" });
//             return;
//         }
//     if (!req.file) return res.status(400).json({ message: "No file uploaded" });
//
//      if (user.profileImagePublicId) {
//       await cloudinaryHelper.deleteFile(user.profileImagePublicId);
//     }
//
//     const result = await cloudinaryHelper.uploadImage(req.file.path, "vireworkplace/profile_pictures");
//     const updatedUser = await User.findByIdAndUpdate(req.user?.userId, { profileImage: result.url,  profileImagePublicId: result.publicId, }, { new: true });
//
//     res.status(200).json({
//          success: true,
//          message: "Profile picture updated successfully",
//          data: updatedUser
//      });
//     return;
//
//   } catch (error) {
//     console.error("Error getting settings:", error);
//     res.status(500).json({ success: false, message: "Internal Server error" });
//     return;
//   }
// };

//******** Account Details **********//

// @route PATCH /api/v1/settings/profile
// @desc Update logged-in user's profile & employee profile
// @access Private
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const {
      fullName,
      email,
      phoneNumber,
    } = req.body;

    //Ensure User exists
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    //Update User fields
    await User.findByIdAndUpdate(
      userId,
      {
        ...(fullName && { fullName }),
        ...(email && { email }),
        ...(phoneNumber && { phoneNumber }),
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "User profile updated successfully."
    });
    return;

  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
    return;
  }
};


//******** Account Password **********//

//@route PATCH /api/v1/account/password
//@desc Update Password of Logged-in user
//@access Private
export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = (req.user as any)?.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        const { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword) {
            res.status(400).json({
                success: false,
                message: "Old password and new password are required"
            });
            return;
        }

        const user = await User.findById(userId).select('+password');
        if (!user) {
            res.status(404).json({
                success: false,
                message: "User not found"
            });
            return;
        }

        if (!user.password) {
            res.status(400).json({
                success: false,
                message: "User does not have a password"
            });
            return;
        }

        const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
        if (!isPasswordValid) {
            res.status(400).json({
                success: false,
                message: "Invalid old password"
            });
            return;
        }

        //Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashedPassword;

        //Set passwordChangedAt 1 second in the past
        user.passwordChangedAt = new Date(Date.now() - 1000);

        await user.save();

        res.status(200).json({
            success: true,
            message: "Password updated successfully."
        });
        return;

    } catch (error) {
        console.error({ message: "Error changing password", error });
        res.status(500).json({ success: false, error: "Internal Server Error" });
        return;
    }
};

//******** Account Deletion **********//

//@route DELETE /api/v1/account/delete
//@desc Deactivate/Delete account (Soft Delete)
//@access Private
export const deleteAccount = async(req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({success: false, message: "Unauthorized"})
            return;
        }

        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({
                success: false,
                message: "User not found"
            });
            return;
        }

        user.isAccountDeleted = true;
        await user.save();

        res.status(200).json({
            success: true,
            message: "Account deleted successfully."
        });
        return;

    }catch (error) {
        console.log({ message: "Error deleting account", error });
        res.status(500).json({ success: false, error: "Internal Server Error" });
        return;
    }
}

//******** Customer Order History **********//

//@route GET /api/v1/account/order-history
//@desc Get Order History of Logged-in user
//@access Private
export const customerOrderHistory = async(req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({success: false, message: "Unauthorized: User not authenticated."})
            return;
        }

        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({
                success: false,
                message: "User not found"
            });
            return;
        }

        // Pagination
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const cacheKey = `order-history:${userId}:page:${page}`;
        const cached = await redisClient.get(cacheKey);
        if (cached) {
            res.status(200).json({
                success: true,
                message: "Order history fetched (cache hit)",
                data: JSON.parse(cached),
            });
            return;
        }

        //Get Order History of User
        const [orders, total] = await Promise.all([
            Order.find({ userId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Order.countDocuments({ userId }),
        ]);
        if(!orders){
            res.status(404).json({
                success: false,
                message: "Your order history is empty. Please place an order to view your order history."
            });
            return;
        }

        const responseData = {
            orders,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };

        await redisClient.setex(cacheKey, 300, JSON.stringify(responseData));

        res.status(200).json({
            success: true,
            message: "order history fetched successfully.",
            data: {
                user: {
                    id: user._id,
                    firstName: user.fullName,
                },
                orders: responseData
            },
        });
        return;

    }catch (error) {
        console.log({ message: "Error fetching order history", error });
        res.status(500).json({ success: false, error: "Internal Server Error" });
        return;
    }
}