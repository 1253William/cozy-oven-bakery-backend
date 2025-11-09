import { Response, Request, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../services/account/user.model';

interface AuthRequest extends Request {
    user?: string | jwt.JwtPayload
}

export const authMiddleware = async(req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            res.status(401).json({
                success: false,
                message: "Unauthorized: No token provided"
            });
            return;
        }

        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string, async (error, user) => {
            if (error) {
                res.status(403).json({
                    success: false,
                    message: "Forbidden: Invalid or expired token "
                });
                return;
            }

            //check if password was changed after token was issued
            const dbUser = await User.findById((user as any).userId).select("+passwordChangedAt");
            if (dbUser && dbUser.passwordChangedAt && (user as any).iat * 1000 < dbUser.passwordChangedAt.getTime()) {
                res.status(401).json({
                    success: false,
                    message: "Password was changed after this token was issued. Please log in again."
                });
                return;
            }

            (req as any).user = user;

            next();
        });

    } catch (error) {
        res.status(400).json(
            {
                success: false,
                message: "Invalid or expired token",
                error: error
            }
        )
    }
}
