import {Request, Response} from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import UserModel, {User} from '../account/user.model';
import generateOTP from '../../utils/OTP';
import OTPVerification from './OTPVerification.model';
import {CustomJwtPayload} from '../../types/authRequest';
import { sendEmail } from '../../utils/email.transporter';
import { sendSMS } from "../../utils/sendSMS";
import { sendNotification } from "../notifications/notificationMain.service";

import redisClient from '../../config/redis';

require('dotenv').config();


//JWT
const { ACCESS_TOKEN_SECRET } = process.env;

if (!ACCESS_TOKEN_SECRET) {
    throw new Error('ACCESS_TOKEN_SECRET is not defined in .env');
}

//@route POST /api/v1/auth/signup
//@desc Sign Up User (Create User and Hash Password)
//@access Public
export const register = async ( req: Request, res: Response): Promise<void> => {
    try {
        const {
            fullName,
            email,
            phoneNumber,
            password,
            role,
            isAccountDeleted
        } = req.body;

        //Validation
        if (!fullName || !email || !password ) {
            res.status(400).json({
                success: false,
                message: "First Name, Email, Phone Number are required"
            });
            return
        }

        //Email domain restriction for Admins
        const ALLOWED_ADMIN_DOMAIN = "cozyoven.store";

        //Validate Admin registration domain
        if (role === "Admin" && !email.toLowerCase().endsWith(`@${ALLOWED_ADMIN_DOMAIN}`)) {
            res.status(403).json({
                success: false,
                message: `Unauthorized: Only users with an @${ALLOWED_ADMIN_DOMAIN} email can register as Admin.`,
            });
            return;
        }

        if(password.length < 8) {
            res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters long"
            });
            return
        }

        //Check if email is valid
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            res.status(400).json({
                success: false,
                message: "Invalid email format"
            });
            return;
        }

        //Check for existing user
        const existingUser = await UserModel.findOne({ email }) as User;
        if (existingUser) {
            //Restore the user's account if it was deleted
           if (existingUser.isAccountDeleted) {
            existingUser.isAccountDeleted = false;
            existingUser.password = await bcrypt.hash(password, 10); 
            await existingUser.save();

            res.status(200).json({
                success: true,
                message: 'Account restored successfully. Please log in with your password and work ID.',
            });
            return;
            }
            res.status(400).json({
                success: false,
                message: 'User already exists, try logging in.',
            });
            return;
        }

        //Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        //Create New User
        const newUser: User = await UserModel.create({
            fullName,
            email,
            phoneNumber,
            password: hashedPassword,
            role,
            isAccountDeleted
        });

        //Email HTML content 
        const emailText =
`Hello ${newUser.fullName.split(' ')[0]},
We’re thrilled to have you join the Cozy Oven family — where every bite feels like home.  
Your account has been successfully created, and you can now explore our range of freshly baked banana breads and special oven-to-door offers.
        
 ------------------------
        
Here’s what you can do next:
🛒 Browse and order your favorite treats from your dashboard
⭐ Save favorites and get updates on special packages
🚚 Track your orders in real time

Go to My Account: https://cozyoven.store/login

Thank you for choosing Cozy Oven — we can’t wait to bake something amazing for you! 
        
©Cozy Oven Store. All rights reserved
`;
        //Email message
        await sendEmail({
            email: newUser.email,
            subject: "🎉 Welcome to Cozy Oven — Freshly baked banana bread happiness awaits!",
            text: emailText,
        });

        //Send SMS notification
        const firstName = newUser.fullName.split(" ")[0];
        const smsMessage = `Welcome to Cozy Oven, ${firstName}! Your account’s ready. Visit www.cozyoven.store to order your favorite banana bread today!`;

        //Fire and forget — no blocking response
        await sendSMS({
            recipient: [newUser.phoneNumber],
            message: smsMessage,
        });

        res.status(201).json({
            success: true,
            message: "Your account’s ready.",
        });

    } catch (error: unknown) {
        console.log({message: "Error signing up user", error: error});
        res.status(500).json({ success: false, error: "Internal Server Error" });
        return
    }
}

//@route POST /api/v1/auth/login
//@desc Login User (JWT authentication with access token)
//@access Public
export const login = async (req: Request, res: Response): Promise<void> => {
  const start = Date.now();

  try {
    const { email, password } = req.body;

    //Validation
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: "All fields are required"
      });
      return;
    }

    //Query MongoDB for user
    const matchedUser = await UserModel.findOne({ email }).select("+password");
    if (!matchedUser) {
      res.status(400).json({
        success: false,
        message: "User not found with the provided email"
      });
      return;
    }

    //Deleted account check
    if (matchedUser.isAccountDeleted) {
      res.status(404).json({
        success: false,
        message: "Account has been deleted, please sign up again."
      });
      return;
    }

    //Verify password
    const validPassword = await bcrypt.compare(password, matchedUser.password);
    if (!validPassword) {
      res.status(400).json({
        success: false,
        message: "Invalid credentials"
      });
      return;
    }

    //Create JWT access token
    const accessToken = jwt.sign(
      {
        userId: matchedUser._id,
        email: matchedUser.email,
        role: matchedUser.role
      },
      process.env.ACCESS_TOKEN_SECRET!,
      { expiresIn: "30m", algorithm: "HS256" }
    );

    //Prepare safe user object
    const { password: _, ...safeUser } = matchedUser.toObject();

    //Log processing time
    const elapsedTime = Date.now() - start;
    console.log(`Login request processed in ${elapsedTime} ms`);

    res.status(200).json({
      success: true,
      message: "User logged in successfully",
      accessToken,
      data: safeUser
    });
    return;

  } catch (error: unknown) {
    console.error({ message: "Error logging in user", error });
    res.status(500).json({ success: false, error: "Internal Server Error" });
    return;
  }
};


//@route POST /api/v1/auth/forgot-password
//@desc Send OTP for password reset
//@access public
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ success: false, message: 'Email is required to reset your password' });
            return;
        }

        const user = await UserModel.findOne({ email });
        if (!user) {
            // Don't leak email existence
            res.status(200).json({ success: true, message: 'If a user exists, an OTP has been sent to the email' });
            return;
        }

        //Clean up previous OTPs
        await OTPVerification.deleteMany({ userId: user._id });

        const otp = generateOTP();
        const hashedOtp = await bcrypt.hash(otp, 10);

        await new OTPVerification({
            userId: user._id,
            email: email,
            otp: hashedOtp,
            createdAt: Date.now(),
            expiresAt: Date.now() + 10 * 60 * 1000,
        }).save();

        const tempToken = jwt.sign(
            { userId: user._id },
            process.env.ACCESS_TOKEN_SECRET!,
            { expiresIn: "10m" }
        );

        const emailText = `
Hello ${user.fullName},

You requested to reset your password.

🔐 OTP Code: ${otp}

This OTP expires in 10 minutes. If you didn't request this, ignore this email.

Thank you,

©Cozy Oven Store. All rights reserved
        `;

        await sendEmail({
            email: user.email,
            subject: "🔐 Password Reset OTP",
            text: emailText,
        });

        res.status(200).json({
            success: true,
            message: "An OTP has been sent to your email. Please check your inbox.",
            tempToken: tempToken,
        });
        return;

    } catch (error) {
        console.log({ message: "Error sending reset OTP:", error });
        res.status(500).json({ success: false, error: "Internal Server Error" });
        return;
    }
};


//@route POST /api/v1/auth/forgot-password/verify-otp
//@desc Verify OTP and issue temporary token for password reset
//@access public
export const verifyForgotPasswordOTP = async (req: Request, res: Response): Promise<void> => {
    try {
        const { otp } = req.body;
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ success: false, message: 'Authorization token missing or malformed' });
            return;
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!);
        const userId = (decoded as { userId: string }).userId;

        const otpRecord = await OTPVerification.findOne({ userId });
        if (!otpRecord) {
            res.status(400).json({ success: false, message: 'OTP not found or already used' });
            return;
        }

        if (otpRecord.expiresAt.getTime() < Date.now()) {
            await OTPVerification.deleteMany({ userId });
            res.status(400).json({ success: false, message: 'OTP expired. Request a new one.' });
            return;
        }

        const isValid = await bcrypt.compare(otp, otpRecord.otp);
        if (!isValid) {
            res.status(400).json({ success: false, message: 'Invalid OTP' });
            return;
        }

        await OTPVerification.deleteMany({ userId });

        const resetToken = jwt.sign(
            { userId },
            process.env.ACCESS_TOKEN_SECRET!,
            { expiresIn: '15m' }
        );

        res.status(200).json({
            success: true,
            message: 'OTP verified. You can now reset your password.',
            resetToken: resetToken,
        });
        return;

    } catch (error) {
        console.log({ message: 'Error verifying OTP', error });
        res.status(500).json({ success: false, error: 'Internal Server Error' });
        return;
    }
};


//Controller for resetting password
//PUT /api/v1/auth/otp/reset
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const { newPassword } = req.body;
        const authHeader = req.headers.authorization;

        if (!newPassword || newPassword.length < 8) {
            res.status(400).json({ success: false, message: 'New Password is required and must be at least 8 characters' });
            return;
        }
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ success: false, message: 'Unauthorized request. Please verify OTP first.' });
            return;
        }

        //Extract tempToken from the Authorization header
        const tempToken = authHeader.split(" ")[1];

        let decoded: CustomJwtPayload;

        try {
            decoded = jwt.verify(tempToken, ACCESS_TOKEN_SECRET) as CustomJwtPayload;
        } catch (err: any) {
            if (err.name === "TokenExpiredError") {
                res.status(401).json({
                    success: false,
                    message: "Reset token has expired. Please request a new OTP.",
                });
                return;
            }
            res.status(400).json({
                success: false,
                message: "Invalid reset token.",
            });
            return;
        }

        if (!decoded || !decoded.userId) {
            res.status(400).json({ error: "Invalid or expired reset password token" });
            return;
        }

        const user = await UserModel.findById(decoded.userId);
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        user.passwordChangedAt = new Date(Date.now());
        await user.save();

        //Send confirmation email
        const emailText =
 `
Hello ${user.fullName},

We wanted to let you know that your account password was successfully changed.

If you made this change, no further action is needed.

Didn’t request this change?
If you did not perform this action, please contact our support team immediately to secure your account. Toll free: 0800-123-4567 

Thank you.

©Cozy Oven Store. All rights reserved`;

        await sendEmail({
            email: user.email,
            subject: "✅ Password Changed Successfully Updated",
            text: emailText,
        });

        res.status(200).json({
            success: true,
            message: "Password reset successfully. You can now log in with your new password.",
        })
        return;

    }catch (error: unknown) {
        console.log({message: "Error resetting password:", error: error});
        res.status(500).json({success: false, error: "Internal Server Error"});
        return
    }
}


//@route POST /api/v1/auth/forgot-password/otp/resend
//@desc Resend OTP for password reset
//@access Public
export const resendResetPasswordOTP = async (req: Request, res: Response): Promise<void> => {
    try {
          const { email } = req.body;
        if (!email) {
            res.status(400).json({ success: false, message: 'Email is required to resend OTP' });
            return;
        }

        const user = await UserModel.findOne({email});
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }

        // Clean up previous OTPs
        await OTPVerification.deleteMany({ userId: user._id });

        const otp = generateOTP();
        const hashedOtp = await bcrypt.hash(otp, 10);

        await new OTPVerification({
            userId: user._id,
            email: user.email,
            otp: hashedOtp,
            createdAt: Date.now(),
            expiresAt: Date.now() + 10 * 60 * 1000,
        }).save();

        const tempToken = jwt.sign(
        { userId: user._id },
        process.env.ACCESS_TOKEN_SECRET!,
        { expiresIn: "10m" }
        );

 //Email HTML content 
        const emailText =
` Hello ${user.fullName},
You requested to reset your password.
🔐 Your OTP Code: ${otp}

This code is valid for the next 10 minutes. Please do not share this code with anyone for security reasons.
If you didn't request this, ignore this email.
Once verified, you’ll be able to reset your password.

Need help? Feel free to contact us anytime. Toll free: 0800-123-4567

Thank you!

©Cozy Oven Store. All rights reserved.
`;

    await sendEmail({
            email: user.email,
            subject: "🎉 One Time Password (OTP) for Password Reset",
            text: emailText,
        });

        res.status(200).json({
            success: true,
            message: "An OTP has been resent to your email. Please check your inbox.",
            tempToken: tempToken
        });
        return;

    } catch (error: unknown) {
        console.log({message: "Error resending password reset OTP", error: error});
        res.status(500).json({success: false, error: "Internal Server Error"});
        return
    }
}
