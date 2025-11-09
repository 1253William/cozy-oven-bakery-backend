import {Request, Response} from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import UserModel, {User} from '../account/user.model';
import generateOTP from '../../utils/OTP';
import OTPVerification from './OTPVerification.model';
import {CustomJwtPayload} from '../../types/authRequest';
import {sendEmail} from '../../utils/email.transporter';
import { sendNotification } from "../notifications/notificationMain.service";

import redisClient from '../../config/redis';
// import { getIO } from "../config/socketio";

// const io = getIO();

require('dotenv').config();


//JWT
const { ACCESS_TOKEN_SECRET } = process.env;

if (!ACCESS_TOKEN_SECRET) {
    throw new Error('ACCESS_TOKEN_SECRET is not defined in .env');
}

//Email whitelists - Allowed emails for Admins and HR
const ADMIN_WHITELIST = [
    "michael@vire.agency",
    "nanag@vire.agency",
    "vire.engineering@gmail.com",
];

const HR_WHITELIST = [
    "tamoatengdadzie@gmail.com",
];


//@route POST /api/v1/auth/signup
//@desc Sign Up User (Create User and Hash Password)
//@access Public
export const register = async ( req: Request, res: Response): Promise<void> => {
    try {
        const {
            firstName,
            lastName,
            phoneNumber,
            email,
            dateOfBirth,
            gender,
            password,
            profileImage,
            jobTitle,
            role,
            department,
            employmentStatus,
            workStatus,
            isAccountDeleted } = req.body;
            let userName = req.body.userName;

        //Validation
        if (!firstName || !lastName || !phoneNumber || !email ||!dateOfBirth || !gender || !password || !jobTitle) {
            res.status(400).json({
                success: false,
                message: "First Name, Last Name, Email, Phone Number, Date of Birth, Gender, Password, Job Title, Role are required"
            });
            return
        }

        //Role restriction logic
        if (role === "Admin" && !ADMIN_WHITELIST.includes(email)) {
            res.status(403).json({
                success: false,
                message: "Unauthorized: You can not register as an Admin",
            });
            return;
        }

        if (role === "Human Resource Manager" && !HR_WHITELIST.includes(email)) {
            res.status(403).json({
                success: false,
                message: "Unauthorized: You can not register as an HR",
            });
            return;
        }

        if (role !== "Admin" && role !== "Human Resource Manager" && role !== "Staff") {
            res.status(400).json({
                success: false,
                message: "Invalid role. Only Admin, Human Resource Manager, or Staff are allowed",
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

        //Check if date of birth is in the past
        const referenceDate = new Date(); 
        const minDob = new Date(referenceDate);
        minDob.setFullYear(minDob.getFullYear() - 15);

        const dob = new Date(dateOfBirth);
        if (dob > minDob) {
            res.status(400).json({
                success: false,
                message: "User must be at least 15 years old as of the reference date"
            });
            return;
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

        //Check if phone number is valid
        const phoneRegex = /^\+?[1-9]\d{1,14}$/; // E.164 format
        if (!phoneRegex.test(phoneNumber)) {
            res.status(400).json({
                success: false,
                message: "Invalid phone number format"
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

         //Check for existing phone number
        const existingPhone = await UserModel.findOne({ phoneNumber });
        if (existingPhone) {
            res.status(400).json({
                success: false,
                message: "Phone number already exists. Please use a different number."
            });
            return;
        }

        //Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        //Generate unique username
        let generatedUserName = '@' + firstName.toLowerCase().replace(/\s+/g, '') + Math.floor(1000 + Math.random() * 9000);
                let counter = 1;
        while (await UserModel.findOne({ userName })) {
            userName = `@${firstName.toLowerCase().replace(/\s+/g, '')}${counter++}`;
        }

        //Create New User
        const newUser: User = await UserModel.create({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            role,
            userName: generatedUserName,
            profileImage,
            phoneNumber,
            dateOfBirth,
            gender,
            jobTitle,
            department,
            employmentStatus,
            workStatus,
            isAccountDeleted
        });

        const otp = generateOTP();
        const hashedOtp = await bcrypt.hash(otp, 10);

        //Save OTP to the database
        await new OTPVerification({
            userId: newUser._id,
            email: email,
            otp: hashedOtp,
            createdAt: Date.now(),
            expiresAt: Date.now() + 10 * 60 * 1000,
        }).save();

        const tempToken = jwt.sign(
        { userId: newUser._id },
        process.env.ACCESS_TOKEN_SECRET!,
        { expiresIn: "10m" }
        );

        //Email HTML content 
        const emailText =
` Hello ${newUser.firstName},
Welcome to Vire Workplace! 🎉

To complete your account setup, please use the One-Time Password (OTP) below to verify your account:
 🔐 Your OTP Code: ${otp}
        
 ------------------------
        
This code is valid for the next 10 minutes. Please do not share this code with anyone for security reasons.

Once verified, you’ll receive your unique Work ID for all future logins.

Need help? Feel free to contact us anytime. Toll free: 0800-123-4567 

Thank you for joining Vire Workplace!
        
Vire Workplace Team
Modern Workplace.`;

        await sendEmail({
            email: newUser.email,
            subject: "🎉 Sign Up Successful! Verify Your Vire Workplace Account",
            text: emailText,
        });

        //Email Notification
//         await sendNotification({
//         roles: ["Admin", "Human Resource Manager"],
//         title: "🆕 New User Onboarding Notification",
//         message: `A new user has joined Vire Workplace: ${newUser.firstName} ${newUser.lastName} has successfully signed up. 

// Vire Workplace Team
// Modern Workplace.`,
//         priority: "high",
//         type: "System",
//         channels: ["socket", "email"],
//         emails: ["admin@vire.com", "hr@vire.com", "williamofosuparwar@gmail.com"], // fallback email if needed
//         });

        res.status(201).json({
            success: true,
            message: "An account verification OTP has been sent to your email. Please check your inbox.",
            tempToken: tempToken
        });

    } catch (error: unknown) {
        console.log({message: "Error signing up user", error: error});
        res.status(500).json({ success: false, error: "Internal Server Error" });
        return
    }
}


//Controller for verifying Account Sign Up OTP
//POST /api/v1/auth/otp/verify-account
//@public
export const verifyAccountOTP = async (req: Request, res: Response): Promise<void> => {
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
        if (!otp) {
            res.status(400).json({ success: false, message: 'OTP is required' });
            return;
        }

        const otpRecord = await OTPVerification.findOne({ userId });
        if (!otpRecord) {
            res.status(400).json({ success: false, message: 'OTP not found or already used'});
            return;
        }

        if (otpRecord.expiresAt.getTime() < Date.now()) {
            await OTPVerification.deleteMany({ userId });
            res.status(400).json({ success:false, message: "OTP has expired. Request a new one." });
            return;
        }

        const user = await UserModel.findById(otpRecord.userId);
        if (!user) {
            res.status(400).json({ success: false, message: 'User not found' });
            return;
        }

        const validOtp = await bcrypt.compare(otp, otpRecord.otp);
        if (!validOtp) {
            res.status(400).json({ success: false, message: 'Invalid OTP' });
            return;
        }

         if(user.isAccountVerified){
            res.status(200).json({
                success: false,
                message: "Account already verified."
            });
            return;
        }

        //Generate unique Work ID
        const randomDigits = Math.floor(100000 + Math.random() * 900000);
        const workIdPlain = `VIRE-${randomDigits}`;
    
        user.workId = workIdPlain;
        user.isAccountVerified = true;
       
        await user.save();

        await OTPVerification.deleteMany({ userId: user._id });

        //Send Welcome Email
        const emailText = `
🎉 Welcome to Vire Workplace, ${user.firstName.split(' ')[0]}!

Your account is now active. Here are your login details:

Employee Work ID: ${workIdPlain}
Department: ${user.department || 'N/A'}
Job Title: ${user.jobTitle}

Login Link: https://workplace.vire.agency

Note: For security reasons, we never store your password. Use your Employee ID and password to log in.

For any issues, feel free to contact us anytime. Toll free: 0800-123-4567 

Thank you,  
Vire Workplace Team`;

        await sendEmail({
            email: user.email,
            subject: "🎉 Welcome to Vire Workplace! Your Account Details",
            text: emailText,
        });

        res.status(200).json({
            success: true,
            message: "Account verified! Your Work ID has been sent to your email.",
        });

    }catch (error: unknown) {
        console.log({message: "Error verifying OTP:", error: error});
        res.status(500).json({success: false, error: "Internal Server Error"});
        return
    }
}


//@route POST /api/v1/auth/otp/resend
//@desc Resend OTP for account verification
//@access Public
export const resendAccountVerificationOTP = async (req: Request, res: Response): Promise<void> => {
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
` Hello ${user.firstName},
Welcome to Vire Workplace! 🎉

To complete your account setup, please use the One-Time Password (OTP) below to verify your account:
 🔐 Your OTP Code: ${otp}
        
 ------------------------
        
This code is valid for the next 10 minutes. Please do not share this code with anyone for security reasons.

Once verified, you’ll receive your unique Work ID for all future logins.

Need help? Feel free to contact us anytime. Toll free: 0800-123-4567 

Thank you for joining Vire Workplace!
        
Vire Workplace Team
Modern Workplace.`;

    await sendEmail({
            email: user.email,
            subject: "🎉 One Time Password (OTP) for Account Verification",
            text: emailText,
        });

        res.status(200).json({
            success: true,
            message: "An OTP has been resent to your email. Please check your inbox.",
            tempToken: tempToken
        });

    } catch (error: unknown) {
        console.log({message: "Error resending verification account OTP", error: error});
        res.status(500).json({success: false, error: "Internal Server Error"});
        return
    }
}


//@route POST /api/v1/auth/login
//@desc Login User (JWT authentication with access token)
//@access Public
export const login = async (req: Request, res: Response): Promise<void> => {
  const start = Date.now();

  try {
    const { workId, password } = req.body;

    //Validation
    if (!workId || !password) {
      res.status(400).json({
        success: false,
        message: "All fields are required"
      });
      return;
    }

    const isValidWorkId = (id: string): boolean => {
      const regex = /^VIRE-\d{6,}$/i;
      return regex.test(id);
    };

    if (!isValidWorkId(workId)) {
      res.status(400).json({
        success: false,
        message: "Invalid Work ID format."
      });
      return;
    }

    //Query MongoDB for user
    const matchedUser = await UserModel.findOne({ workId }).select("+password");
    if (!matchedUser) {
      res.status(400).json({
        success: false,
        message: "User not found with the provided Work ID"
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
    const { password: _, workId: __, ...safeUser } = matchedUser.toObject();

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
Hello ${user.firstName},

You requested to reset your password.

🔐 OTP Code: ${otp}

This OTP expires in 10 minutes. If you didn't request this, ignore this email.

Thank you,
Vire Workplace Team
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
Hello ${user.firstName},

We wanted to let you know that your account password was successfully changed.

If you made this change, no further action is needed.

Didn’t request this change?
If you did not perform this action, please contact our support team immediately to secure your account. Toll free: 0800-123-4567 

Thank you for using Vire Workplace,
The Vire Workplace Team`;

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
` Hello ${user.firstName},
You requested to reset your password.
🔐 Your OTP Code: ${otp}

This code is valid for the next 10 minutes. Please do not share this code with anyone for security reasons.
If you didn't request this, ignore this email.
Once verified, you’ll be able to reset your password.

Need help? Feel free to contact us anytime. Toll free: 0800-123-4567
Thank you for using Vire Workplace!

Vire Workplace Team
Modern Workplace.
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
