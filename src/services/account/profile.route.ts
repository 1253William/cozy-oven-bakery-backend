import express from "express";
import { authMiddleware } from "../../middlewares/authentication.middleware";
import { authorizedRoles } from "../../middlewares/roles.middleware";
import { upload } from "../../middlewares/upload.middleware";
import { changePassword, deleteAccount, updateProfile, updateProfilePicture } from "./profile.controller";


const router = express.Router();

/**
 * @swagger
 * /api/v1/settings/profile-image:
 *   patch:
 *     tags:
 *       - Settings
 *     summary: Update user's profile image
 *     description: Uploads and updates the authenticated user's profile picture. The previous image is deleted from Cloudinary before saving the new one.
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
 *                 description: Profile image file to upload
 *     responses:
 *       200:
 *         description: Profile picture updated successfully.
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
 *                   example: Profile picture updated successfully
 *                 data:
 *                   type: object
 *                   description: Updated user object
 *       400:
 *         description: No file uploaded or unauthorized
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal Server Error
 */
//@route PATCH /api/v1/settings/profile-image
//@desc Update profile photo (profile image) of Logged-in user
//@access private
router.patch('/profile-image', authMiddleware, authorizedRoles("Staff", "Admin", "Human Resource Manager"),
  upload.single("file"), updateProfilePicture);

/**
 * @swagger
 * /api/v1/settings/profile:
 *   patch:
 *     tags:
 *       - Settings
 *     summary: Update user's profile and employee details
 *     description: Updates the authenticated user's basic info (User model) and extended employee details (EmployeeProfile model).
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: "John"
 *               lastName:
 *                 type: string
 *                 example: "Doe"
 *               phoneNumber:
 *                 type: string
 *                 example: "+1234567890"
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 example: "1990-01-01"
 *               jobTitle:
 *                 type: string
 *                 example: "Software Engineer"
 *               department:
 *                 type: string
 *                 example: "Engineering"
 *               role:
 *                 type: string
 *                 enum: [Staff, Admin, Human Resource Manager]
 *                 example: "Staff"
 *               personalInfo:
 *                 type: object
 *                 properties:
 *                   nationality:
 *                     type: string
 *                     example: "Ghanaian"
 *                   maritalStatus:
 *                     type: string
 *                     enum: [Single, Married, Divorced, Widowed, Other]
 *                     example: "Single"
 *                   personalPronouns:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: ["he/him"]
 *               contactInfo:
 *                 type: object
 *                 properties:
 *                   email:
 *                     type: string
 *                     example: "john.doe@example.com"
 *                   phoneNumber:
 *                     type: string
 *                     example: "+1234567890"
 *                   address:
 *                     type: string
 *                     example: "123 Main St"
 *                   city:
 *                     type: string
 *                     example: "Accra"
 *                   regionOrState:
 *                     type: string
 *                     example: "Greater Accra"
 *                   postalCode:
 *                     type: string
 *                     example: "00233"
 *               emergencyContact:
 *                 type: object
 *                 properties:
 *                   fullName:
 *                     type: string
 *                     example: "Jane Doe"
 *                   relationship:
 *                     type: string
 *                     example: "Sister"
 *                   phoneNumber:
 *                     type: string
 *                     example: "+233555123456"
 *                   address:
 *                     type: string
 *                     example: "456 Ring Road, Accra"
 *               employmentDetails:
 *                 type: object
 *                 properties:
 *                   jobTitle:
 *                     type: string
 *                     example: "Backend Developer"
 *                   department:
 *                     type: string
 *                     example: "Engineering"
 *                   employmentType:
 *                     type: string
 *                     enum: [Full-time, Part-time, Contract, Internship]
 *                     example: "Full-time"
 *                   supervisorName:
 *                     type: string
 *                     example: "Mary Johnson"
 *                   employmentStatus:
 *                     type: string
 *                     enum: [Active, On Leave, Terminated]
 *                     example: "Active"
 *               qualifications:
 *                 type: object
 *                 properties:
 *                   education:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         level:
 *                           type: string
 *                           example: "Bachelor's"
 *                         degree:
 *                           type: string
 *                           example: "Computer Science"
 *                         institution:
 *                           type: string
 *                           example: "University of Ghana"
 *                         startDate:
 *                           type: object
 *                           properties:
 *                             month:
 *                               type: string
 *                               example: "September"
 *                             year:
 *                               type: string
 *                               example: "2015"
 *                         endDate:
 *                           type: object
 *                           properties:
 *                             month:
 *                               type: string
 *                               example: "June"
 *                             year:
 *                               type: string
 *                               example: "2019"
 *                         description:
 *                           type: string
 *                           example: "Graduated with honors"
 *                   skills:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: ["Node.js", "TypeScript", "MongoDB"]
 *     responses:
 *       200:
 *         description: User profile updated successfully.
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal Server Error
 */
//@route PATCH /api/v1/settings/profile
//@desc Update profile (fullName, phoneNumber, dateOfBirth, jobTitle, department etc) of Logged-in user
//@access private
router.patch('/profile', authMiddleware, authorizedRoles("Staff", "Admin", "Human Resource Manager"), updateProfile);

/**
 * @swagger
 * /api/v1/settings/profile/password:
 *   patch:
 *     tags:
 *       - Settings
 *     summary: Change user password
 *     description: Allows an authenticated user to change their password using the current password.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 format: password
 *                 example: "OldPass123!"
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: "NewSecurePass456!"
 *     responses:
 *       200:
 *         description: Password updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation or password mismatch error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal Server Error
 */
//@route PATCH /api/v1/settings/profile/password
//@desc Change password (when logged in)
//@access private
router.patch('/profile/password', authMiddleware, authorizedRoles("Staff", "Admin", "Human Resource Manager"), changePassword);

/**
 * @swagger
 * /api/v1/settings/account/delete:
 *   delete:
 *     tags:
 *       - Settings
 *     summary: Delete (soft delete) user account
 *     description: Marks the authenticated user's account as deleted.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal Server Error
 */
//@route DELETE	/api/v1/settings/account/delete
//@desc Deactivate/Delete account (Soft Delete)
//@access private
router.delete('/account/delete', authMiddleware, authorizedRoles("Staff", "Admin", "Human Resource Manager"), deleteAccount);

export default router;