import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ENV } from "../config/envConfig";

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ message: 'Authorization Header Missing' });

        const token = authHeader.split(' ')[1];
        if (!token) return res.status(401).json({ message: 'No token Provided' });

        jwt.verify(token, ENV.SECRET_KEY, (err, decoded) => {
            if (err) return res.status(403).json({ message: 'Invalid or expired token' });
            (req as any).decoded = decoded;
            next();
        });
    } catch (err) {
        next(err);
    }
}