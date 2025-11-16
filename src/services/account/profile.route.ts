import express from "express";
import { authMiddleware } from "../../middlewares/authentication.middleware";
import { authorizedRoles } from "../../middlewares/roles.middleware";
import { changePassword, deleteAccount, updateProfile } from "./profile.controller";


const router = express.Router();

/**
 * @swagger
 * /api/v1/account/profile:
 *   patch:
 *     tags:
 *       - Account
 *     summary: Update user's account details
 *     description: Updates the authenticated user's basic info (User model)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 example: "johndoe@example.com"
 *               phoneNumber:
 *                 type: string
 *                 example: "+1234567890"
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
//@route PATCH /api/v1/account/profile
//@desc Update profile (fullName, email, phoneNumber) of Logged-in user
//@access private
router.patch('/profile', authMiddleware, authorizedRoles("Customer", "Admin"), updateProfile);

/**
 * @swagger
 * /api/v1/account/password:
 *   patch:
 *     tags:
 *       - Account
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
//@route PATCH /api/v1/account/password
//@desc Change password (when logged in)
//@access private
router.patch('/password', authMiddleware, authorizedRoles("Customer", "Admin"), changePassword);

/**
 * @swagger
 * /api/v1/account/delete:
 *   delete:
 *     tags:
 *       - Account
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
//@route DELETE	/api/v1/account/delete
//@desc Deactivate/Delete account (Soft Delete)
//@access private
router.delete('/delete', authMiddleware, authorizedRoles("Customer", "Admin"), deleteAccount);

export default router;