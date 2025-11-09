import {Request, Response} from 'express';
import User from './user.model';
import { EmployeeProfile } from '../customers/employee.model';
import { AuthRequest } from '../../types/authRequest'
import { cloudinaryHelper } from '../../utils/helpers/cloudinaryHelper';
import bcrypt from "bcryptjs";
import redisClient from '../../config/redis';
require('dotenv').config();

//@route PATCH /api/v1/settings/profile-image
//@desc Update logged-in user's profile image
//@access Private
export const updateProfilePicture = async (req: AuthRequest, res: Response) => {
  try {
     const userId = req.user?.userId;

        if (!userId) {
            res.status(400).json({ success: false, message: "Unauthorized" });
            return;
        }

        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({ success: false, message: "User not found" });
            return;
        }
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

     if (user.profileImagePublicId) {
      await cloudinaryHelper.deleteFile(user.profileImagePublicId);
    }

    const result = await cloudinaryHelper.uploadImage(req.file.path, "vireworkplace/profile_pictures");
    const updatedUser = await User.findByIdAndUpdate(req.user?.userId, { profileImage: result.url,  profileImagePublicId: result.publicId, }, { new: true });

    res.status(200).json({
         success: true, 
         message: "Profile picture updated successfully",
         data: updatedUser
     });
    return;

  } catch (error) {
    console.error("Error getting settings:", error);
    res.status(500).json({ success: false, message: "Internal Server error" });
    return;
  }
};


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
      firstName,
      lastName,
      phoneNumber,
      dateOfBirth,
      profileImage,
      jobTitle,
      department,
      role,
      personalInfo,
      contactInfo,
      emergencyContact,
      employmentDetails,
      qualifications,
      documents,
      healthInfo,
      workSchedule,
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
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phoneNumber && { phoneNumber }),
        ...(profileImage && { profileImage }),
        ...(dateOfBirth && { dateOfBirth }),
        ...(jobTitle && { jobTitle }),
        ...(department && { department }),
        ...(role && { role }),
      },
      { new: true, runValidators: true }
    );

    //Handle EmployeeProfile (create if missing)
    let employeeProfileId = user.employeeProfile;

    if (!employeeProfileId) {
      //Create a new employee profile doc and link it to the user
      const newProfile = await EmployeeProfile.create({ user: userId });
      user.employeeProfile = newProfile._id as import("mongoose").Types.ObjectId;
      await user.save();
      employeeProfileId = newProfile._id as import("mongoose").Types.ObjectId;
    }

    //Build dot-notation update object
    const updateData: Record<string, any> = {};

    if (personalInfo) {
      if (personalInfo.nationality) updateData["personalInfo.nationality"] = personalInfo.nationality;
      if (personalInfo.maritalStatus) updateData["personalInfo.maritalStatus"] = personalInfo.maritalStatus;
      if (personalInfo.personalPronouns) updateData["personalInfo.personalPronouns"] = personalInfo.personalPronouns;
    }
    if (contactInfo) {
      if (contactInfo.email) updateData["contactInfo.email"] = contactInfo.email;
      if (contactInfo.phoneNumber) updateData["contactInfo.phoneNumber"] = contactInfo.phoneNumber;
      if (contactInfo.address) updateData["contactInfo.address"] = contactInfo.address;
      if (contactInfo.city) updateData["contactInfo.city"] = contactInfo.city;
      if (contactInfo.regionOrState) updateData["contactInfo.regionOrState"] = contactInfo.regionOrState;
      if (contactInfo.postalCode) updateData["contactInfo.postalCode"] = contactInfo.postalCode;
    }
    if (emergencyContact) {
      Object.entries(emergencyContact).forEach(([key, val]) => {
        updateData[`emergencyContact.${key}`] = val;
      });
    }
    if (employmentDetails) {
      Object.entries(employmentDetails).forEach(([key, val]) => {
        updateData[`employmentDetails.${key}`] = val;
      });
    }
    if (qualifications) updateData["qualifications"] = qualifications;
    if (documents) updateData["documents"] = documents;
    if (healthInfo) {
      Object.entries(healthInfo).forEach(([key, val]) => {
        updateData[`healthInfo.${key}`] = val;
      });
    }
    if (workSchedule) updateData["workSchedule"] = workSchedule;

    //Update EmployeeProfile
    if (Object.keys(updateData).length > 0) {
      await EmployeeProfile.findByIdAndUpdate(employeeProfileId, { $set: updateData }, { new: true, runValidators: true });
    }

    //Return full merged profile
    const fullUser = await User.findById(userId).populate("employeeProfile").lean();

    res.status(200).json({
      success: true,
      message: "User profile updated successfully.",
      data: fullUser,
    });
    return;

  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
    return;
  }
};


//@route PATCH /api/v1/settings/profile/password
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


//@route DELETE /api/v1/settings/account/delete
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