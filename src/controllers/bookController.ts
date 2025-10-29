import { Request, Response, NextFunction } from "express";
import { prisma } from '../config/prismaClient';
import { z } from "zod";

const BookSchema = z.object({
    title: z.string().min(1, "Title is required"),
    author: z.string().min(1, "Author is required"),
    userid: z.number()
});

export const createBook = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const parsedData = BookSchema.safeParse(req.body);
        if (!parsedData.success) {
            return res.status(400).json({
                message: 'Invalid Credentials',
                errors: parsedData.error.issues
            });
        }
        const { title, author, userid } = parsedData.data;
        const book = await prisma.book.create({ data: { title, author, user: { connect: { id: userid } } } });
        res.status(201).json({ message: 'Book Created Successfully', book });

    } catch (err) {
        next(err);
    }
};
export const getBook = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const books = await prisma.book.findMany({ include: { user: true } });
        res.json(books);
    } catch (err) {
        next(err);
    }
};
export const getBookbyId = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const bookId = Number(req.params.id);
        const book = await prisma.book.findFirst({ where: { id: bookId }, include: { user: true } });
        if (!book) return res.status(404).json({ message: 'Book not found' });
        res.json(book);
    } catch (err) {
        next(err);
    }
};
export const updateBook = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const bookId = Number(req.params.id);
        const parsedData = BookSchema.safeParse(req.body);
        if (!parsedData.success) {
            return res.status(400).json({
                message: 'Invalid Credentials',
                errors: parsedData.error.issues
            });
        }
        const { title, author } = parsedData.data;
        const updatedBook = await prisma.book.update({
            where: { id: Number(bookId) },
            data: { title, author }
        });
        res.json({ message: 'Book updated Successfully', updatedBook })
    } catch (err) {
        next(err);
    }
};
export const deleteBook = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const bookId = Number(req.params.id);
        const book = await prisma.book.delete({ where: { id: bookId } });
        res.json({
            message: 'Book Deleted Successfully'
        });
    } catch (err) {
        next(err);
    }
}