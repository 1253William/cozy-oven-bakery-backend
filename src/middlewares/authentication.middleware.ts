// import { Response, Request, NextFunction } from 'express';
// import jwt from 'jsonwebtoken';
// import User from '../services/account/user.model';
//
// interface AuthRequest extends Request {
//     user?: string | jwt.JwtPayload
// }
//
// export const authMiddleware = async(req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
//     try {
//         const token = req.headers.authorization?.split(" ")[1];
//
//         if (!token) {
//             res.status(401).json({
//                 success: false,
//                 message: "Unauthorized: No token provided"
//             });
//             return;
//         }
//
//         jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string, async (error, user) => {
//             if (error) {
//                 res.status(403).json({
//                     success: false,
//                     message: "Forbidden: Invalid or expired token "
//                 });
//                 return;
//             }
//
//             //check if password was changed after token was issued
//             const dbUser = await User.findById((user as any).userId).select("+passwordChangedAt");
//             if (dbUser && dbUser.passwordChangedAt && (user as any).iat * 1000 < dbUser.passwordChangedAt.getTime()) {
//                 res.status(401).json({
//                     success: false,
//                     message: "Password was changed after this token was issued. Please log in again."
//                 });
//                 return;
//             }
//
//             (req as any).user = user;
//
//             next();
//         });
//
//     } catch (error) {
//         res.status(400).json(
//             {
//                 success: false,
//                 message: "Invalid or expired token",
//                 error: error
//             }
//         )
//     }
// }

// src/middlewares/authentication.middleware.ts
import { Response, Request, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import User from "../services/account/user.model";
import mongoose from "mongoose";

interface AuthRequest extends Request {
    user?: JwtPayload | string;
}

const DB_FETCH_TIMEOUT_MS = 5000; // change if you want longer

async function withTimeout<T>(p: Promise<T>, ms = DB_FETCH_TIMEOUT_MS): Promise<T> {
    let timer: NodeJS.Timeout | undefined;
    const timeout = new Promise<never>((_, rej) => {
        timer = setTimeout(() => rej(new Error("DB fetch timed out")), ms);
    });
    try {
        const res = await Promise.race([p, timeout]);
        if (timer) clearTimeout(timer);
        return res as T;
    } catch (err) {
        clearTimeout(timer);
        throw err;
    }
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
       const header = req.headers.authorization;
        if (!header) {
            res.status(401).json({ success: false, message: "Unauthorized: No token provided" });
            return;
        }

        const token = header.split(" ")[1];
        if (!token) {
            res.status(401).json({ success: false, message: "Unauthorized: No token provided (bearer missing)" });
            return;
        }

        let decoded: JwtPayload | string;
        try {
            decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string) as JwtPayload | string;
        } catch (err: any) {
            console.warn("[auth] jwt.verify failed:", err?.name || err?.message || err);
            if (err.name === "TokenExpiredError") {
                res.status(401).json({ success: false, message: "Token expired" });
                return;
            }
            res.status(403).json({ success: false, message: "Forbidden: Invalid token" });
            return;
        }

        //Safe DB fetch with timeout
        let dbUser;
        try {
            const userId = (decoded as any).userId;
            if (!userId) {
                res.status(401).json({ success: false, message: "Unauthorized: token missing userId" });
                return;
            }

            //Use withTimeout around Mongoose findById
            dbUser = await withTimeout(User.findById(userId).select("+passwordChangedAt").lean());
        } catch (err: any) {
            res.status(503).json({ success: false, message: "Service unavailable (DB timeout). Try again later." });
            return;
        }

        if (!dbUser) {
            res.status(401).json({ success: false, message: "Unauthorized: user not found" });
            return;
        }

        // passwordChangedAt check (if you store it)
        if ((dbUser as any).passwordChangedAt) {
            const pwChanged = new Date((dbUser as any).passwordChangedAt).getTime();
            const tokenIat = (decoded as any).iat ? (decoded as any).iat * 1000 : null;
            if (tokenIat && tokenIat < pwChanged) {
                res.status(401).json({ success: false, message: "Password changed — please login again." });
                return;
            }
        }

        // attach user (don't attach password)
        (req as any).user = {
            userId: (dbUser as any)._id?.toString() || (decoded as any).userId,
            role: (dbUser as any).role || (decoded as any).role || "Customer"
        };

        next();
    } catch (err) {
        console.error("[auth] unexpected error:", err);
        res.status(500).json({ success: false, message: "Internal server error (auth)" });
    }
};
