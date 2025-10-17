import { Request, Response, NextFunction } from "express";

export const errorMiddleware = async (err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Error: ', err.message);

    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
    });
}