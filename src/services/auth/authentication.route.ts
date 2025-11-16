import express from "express";
import {register, login, forgotPassword, verifyForgotPasswordOTP, resetPassword, resendResetPasswordOTP} from "./authentication.controller";
import { otpRequestLimiter, otpVerifyLimiter, loginRateLimiter } from '../../middlewares/otpLimiter.middleware'
import { apiLimiter } from '../../middlewares/apiLimiter.middleware'

const router = express.Router();


/**
 * @swagger
 * /api/v1/auth/signup:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Sign Up User
 *     description: Creates a new user account with a hashed password. If the email already exists and the account was deleted, it restores the account.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - email
 *               - phoneNumber
 *               - password
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: "Jane Doe"
 *               email:
 *                 type: string
 *                 example: "janedoe@gmail.com"
 *               phoneNumber:
 *                 type: string
 *                 example: "0205345678"
 *               password:
 *                 type: string
 *                 example: "SecuredPassword1234"
 *               role:
 *                 type: string
 *                 enum: ['Customer', 'Admin']
 *                 example: "Customer"
 *     responses:
 *       201:
 *         description: Your account’s ready!
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
 *                   example: Your account’s ready
 *                 tempToken:
 *                   type: string
 *                   description: Temporary JWT token valid for 10 minutes
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

 *       200:
 *         description: Account restored successfully
 *       400:
 *         description: Bad Request - missing fields or user already exists
 *       500:
 *         description: Internal Server Error
 */
//@route POST /api/v1/auth/signup
//@desc Creates a new user
//@access public
router.post('/signup', register);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Log in a user
 *     description: Authenticates a user using their email and Password. If credentials are valid, a JWT token is returned.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: "johndoe@gmail.com"
 *               password:
 *                 type: string
 *                 example: "SecurePassword123!"
 *     responses:
 *       200:
 *         description: User logged in successfully
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
 *                   example: "User logged in successfully"
 *                 accessToken:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "60c72b2f9b1e8d001f9d5a9e"
 *                     fullName:
 *                       type: string
 *                       example: "Jane"
 *                     email:
 *                       type: string
 *                       example: "janedoe@example.com"
 *                     role:
 *                       type: string
 *                       example: "Customer"
 *       400:
 *         description: Invalid email or password
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
 *                   example: "Invalid credentials"
 *       404:
 *         description: Account deleted
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
 *                   example: "Account has been deleted, please sign up again."
 *       500:
 *         description: Internal Server Error
 */
//@route POST /api/v1/auth/login
//@desc Login a user
//@access public
router.post('/login',loginRateLimiter, login);

/**
 * @swagger
 * /api/v1/auth/forgot-password:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Forgot Password - Request OTP
 *     description: Sends a secure, time-limited 5-digit OTP to the user's email to reset their password. The OTP expires in 10 minutes. A temporary token is returned in the response for subsequent OTP verification.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "johndoe@example.com"
 *     responses:
 *       200:
 *         description: OTP sent to the email address.
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
 *                   example: "An OTP has been sent to your email. Please check your inbox."
 *                 tempToken:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI..."
 *       400:
 *         description: Email not provided.
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
 *                   example: "Email is required to reset your password"
 *       500:
 *         description: Internal server error.
 */
//@route POST /api/v1/auth/forgot-password
//@desc reset password when not logged in
//@access public
router.post('/forgot-password', otpRequestLimiter, forgotPassword);

/**
 * @swagger
 * /api/v1/auth/forgot-password/verify-otp:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Verify OTP for Password Reset
 *     description: Verifies the 5-digit OTP sent to the user’s email and returns a reset token valid for 15 minutes, which can be used to reset the password.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - otp
 *             properties:
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: OTP verified and reset token generated.
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
 *                   example: "OTP verified. You can now reset your password."
 *                 resetToken:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         description: Invalid or expired OTP.
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
 *                   example: "OTP not found or already used"
 *       401:
 *         description: Authorization token missing or invalid.
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
 *                   example: "Authorization token missing or malformed"
 *       500:
 *         description: Internal server error.
 */
//@route POST /api/v1/auth/forgot-password/verify-otp
//@desc Verify Forgot Password OTP
//@access public
router.post('/forgot-password/verify-otp', otpVerifyLimiter, verifyForgotPasswordOTP);

/**
 * @swagger
 * /api/v1/auth/otp/reset:
 *   put:
 *     tags:
 *       - Authentication
 *     summary: Reset Password using Verified OTP
 *     description: Allows the user to reset their password using the temporary token issued after successful OTP verification.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newPassword
 *             properties:
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: "NewSecurePassword123!"
 *     responses:
 *       200:
 *         description: Password reset successful
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
 *         description: Invalid or missing token or password
 *       401:
 *         description: Token expired or unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal Server Error
 */
//@route PUT /api/v1/auth/otp/reset
//@desc Reset password
//@access public
router.put('/otp/reset', resetPassword);

/**
 * @swagger
 * /api/v1/auth/forgot-password/otp/resend:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Resend OTP for password reset
 *     description: Sends a new OTP to the user's email for password reset verification.
 *     operationId: resendResetPasswordOTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: johndoe@example.com
 *     responses:
 *       200:
 *         description: OTP has been resent successfully
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
 *                   example: An OTP has been resent to your email. Please check your inbox.
 *                 tempToken:
 *                   type: string
 *                   description: Temporary JWT token for OTP verification
 *       400:
 *         description: Email is required or invalid request
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
 *                   example: Email is required to resend OTP
 *       404:
 *         description: User not found
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
 *                   example: User not found
 *       500:
 *         description: Server error while resending OTP
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Internal Server Error
 */
//@route POST /api/v1/auth/forgot-password/otp/resend
//@desc Resend Password Reset OTP
//@access public
router.post('/forgot-password/otp/resend', apiLimiter, resendResetPasswordOTP)


export default router;