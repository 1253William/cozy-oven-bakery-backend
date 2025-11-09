import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';

export interface AuthRequest extends Request {
    user?: {
        userId: string;
        email?: string;
        role?: string;
    }
}

export interface CustomJwtPayload extends JwtPayload {
    userId: string;
    iat?: number;
    exp?: number;
}

