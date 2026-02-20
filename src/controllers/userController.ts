import { Request, Response, NextFunction } from "express";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { ENV } from "../config/envConfig";
import { z } from "zod";
import { prisma } from "../config/prismaClient";

const registerUserSchema = z.object({
    name: z.string().min(1, 'Name is Required'),
    email: z.email().min(1, 'Email is required'),
    password: z.string().min(1, 'Password is required')
});

const loginSchema = z.object({
    email: z.email().min(1, 'Email is Required'),
    password: z.string().min(1, 'Password is Required')
});

export const registerUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const parsedData = registerUserSchema.safeParse(req.body);
        if (!parsedData.success) {
            return res.status(400).json({
                message: "Validation Error",
                errors: parsedData.error.issues,
            });
        }

        const { name, email, password } = parsedData.data;
        const existingUser = await prisma.user.findFirst({
            where: { email },
        });

        if (existingUser) return res.status(400).json({ message: 'User Already Exist' });
        const hashedpassword = await bcrypt.hash(password, 10);
        const newUser = await prisma.user.create({
            data: {
                name, email, password: hashedpassword
            }
        });
        res.status(201).json({
            message: 'User Created Successfully',
            user: { id: newUser.id, name: newUser.name, email: newUser.email }
        });
    } catch (err) {
        next(err);
    }
};

export const loginUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const parsedData = loginSchema.safeParse(req.body);
        if (!parsedData.success) {
            return res.status(400).json({
                message: "Validation Error",
                errors: parsedData.error.issues,
            });
        }
        const { email, password } = parsedData.data;
        const user = await prisma.user.findFirst({
            where: { email }
        });
        if (!user) return res.status(401).json({ message: 'Invalid email or password' });

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return res.status(401).json({ message: 'Invalid email or password' });

        const token = jwt.sign({ id: user.id, email: user.email }, ENV.SECRET_KEY, { expiresIn: '1h' });
        res.json({
            message: "Login successful",
            token,
            user: { id: user.id, name: user.name, email: user.email },
        });
    } catch (err) {
        next(err);
    }
};