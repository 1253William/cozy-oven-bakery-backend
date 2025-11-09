import express from "express";
import {register, login, forgotPassword, verifyForgotPasswordOTP, resetPassword, verifyAccountOTP, resendAccountVerificationOTP, resendResetPasswordOTP} from "./authentication.controller";
import { otpRequestLimiter, otpVerifyLimiter, loginRateLimiter } from '../../middlewares/otpLimiter.middleware'

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
 *               - firstName
 *               - lastName
 *               - userName
 *               - workId
 *               - phoneNumber
 *               - email
 *               - dateOfBirth
 *               - gender
 *               - password
 *               - profileImage
 *               - jobTitle
 *               - role
 *               - department
 *               - employmentStatus
 *               - workStatus
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: "Jane"
 *               lastName:
 *                 type: string
 *                 example: "Doe"
 *               userName:
 *                 type: string
 *                 example: "jane.doe"
 *               workId:
 *                  type: string
 *                  example: VIRE-256848
 *               phoneNumber:
 *                 type: string
 *                 example: "+1234567890"
 *               email:
 *                 type: string
 *                 example: "janedoe@gmail.com"
 *               dateOfBirth:
 *                 type: string
 *                 example: "1990-01-01"
 *               gender:
 *                 type: string
 *                 example: "Female"
 *               department:
 *                 type: string
 *                 enum: ['Engineering', 'Design', 'Human Resources', 'Social Media', 'Customer Support']
 *                 example: "Engineering"
 *               role:
 *                 type: string
 *                 enum: ['Staff', 'Admin', 'Human Resource Manager']
 *               employmentStatus:
 *                 type: string
 *                 enum: ['Full-time', 'Part-time', 'Internship', 'Contract']
 *               workStatus:
 *                 type: string
 *                 enum: ['remote', 'in-person']
 *               profileImage:
 *                 type: string
 *                 example: "https://example.com/profile.jpg"
 *               jobTitle:
 *                 type: string
 *                 example: "Software Engineer"
 *               password:
 *                 type: string
 *                 example: "SecurePass123!"
 *     responses:
 *       201:
 *         description: An account verification OTP has been sent to your email
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
 *                   example: An account verification OTP has been sent to your email. Please check your inbox
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
 * /api/v1/auth/otp/resend:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Resend OTP for account verification
 *     description: Sends a new OTP to the user's email for account verification. OTP is valid for 10 minutes.
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
 *         description: OTP successfully resent to user's email
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
 *                   description: Temporary JWT token valid for 10 minutes
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Email not provided
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
 *         description: User with provided email not found
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
 *         description: Internal server error
 */
//@route POST /api/v1/auth/otp/resend
//@desc Resend OTP for account verification
//@access public
router.post('/otp/resend', resendAccountVerificationOTP);

/**
 * @swagger
 * /api/v1/auth/otp/verify-account:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Verify Account OTP
 *     description: Verifies the OTP sent to the user's email during signup and generates a unique Work ID.
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
 *                 example: "345678"
 *     responses:
 *       200:
 *         description: Account verified successfully and Work ID generated
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
 *                   example: "Account verified! Your Work ID has been sent to your email."
 *                 workId:
 *                   type: string
 *                   example: "VIRE-123456"
 *       400:
 *         description: Invalid OTP, expired, or user not found
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
 *         description: Missing or malformed authorization token
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
 *         description: Internal Server Error
 */
//Controller for verifying Account Sign Up OTP
//POST /api/v1/auth/otp/verify-account
//@public
router.post('/otp/verify-account', verifyAccountOTP);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Log in a user
 *     description: Authenticates a user using their Work ID and Password. If credentials are valid, a JWT token is returned.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - workId
 *               - password
 *             properties:
 *               workId:
 *                 type: string
 *                 example: "VIRE-123456"
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
 *                     firstName:
 *                       type: string
 *                       example: "Jane"
 *                     lastName:
 *                       type: string
 *                       example: "Doe"
 *                     userName:
 *                       type: string
 *                       example: "jane.doe"
 *                     email:
 *                       type: string
 *                       example: "janedoe@example.com"
 *                     role:
 *                       type: string
 *                       example: "Staff"
 *                     department:
 *                       type: string
 *                       example: "Engineering"
 *                     jobTitle:
 *                       type: string
 *                       example: "Software Engineer"
 *       400:
 *         description: Invalid Work ID or password
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
 *     description: Sends a secure, time-limited 6-digit OTP to the user's email to reset their password. The OTP expires in 10 minutes. A temporary token is returned in the response for subsequent OTP verification.
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
 *     description: Verifies the 6-digit OTP sent to the user’s email and returns a reset token valid for 15 minutes, which can be used to reset the password.
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
//@desc Resend  Password Reset OTP
//@access public
router.post('/forgot-password/otp/resend', resendResetPasswordOTP)


export default router;