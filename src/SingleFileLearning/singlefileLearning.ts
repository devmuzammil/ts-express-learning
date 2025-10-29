import dotenv from "dotenv";
dotenv.config();
import express, { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import path from "path";
import multer from "multer";
import jwt from "jsonwebtoken";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cors from 'cors';
import bcrypt from 'bcrypt';
const prisma = new PrismaClient();

const app = express();
const port = 3000;
const SECRET_KEY = process.env.SECRET_KEY as string;
app.use(helmet());

app.use(express.json());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many request,please try again later . ',
});

app.use(limiter);

app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

let refreshTokens: string[] = [];

// ==================== Logger Middleware ====================
const logger = (req: Request, res: Response, next: NextFunction) => {
    console.log(`${req.method} ${req.url}`);
    next();
};

// ==================== Auth Middleware ====================
const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader) return res.status(401).json({ message: "Authorization header missing" });

    const token = authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Token not provided" });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ message: "Invalid or expired token" });
        (req as any).user = user;
        next();
    });
};

// ==================== Zod Schema & Interface ====================
const BookSchema = z.object({
    title: z.string().min(1, "Title is required"),
    author: z.string().min(1, "Author is required"),
    userid: z.number()
});

const SignupSchema = z.object({
    name: z.string().min(1, 'name is required'),
    email: z.string().min(1, 'email is required'),
    password: z.string().min(1, 'password is required')
});

interface Book {
    id: number;
    title: string;
    author: string;
}

// ==================== Multer Setup ====================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "src/uploads");
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, Date.now() + ext);
    },
});

const upload = multer({ storage });

// ==================== Dummy Data ====================
let books: Book[] = [
    { id: 1, title: "Atomic Habits", author: "James Clear" },
    { id: 2, title: "The Alchemist", author: "Paulo Coelho" },
];

app.use(logger);

// ==================== ROUTES ====================

// Home Route
app.get("/", (req: Request, res: Response) => {
    res.send("Welcome to Al-Hadi Book Store");
});

// Get All Books
app.get("/books", async (req: Request, res: Response) => {
    const books = await prisma.book.findMany();
    res.json(books);
});

// Get Single Book
app.get("/books/:id", async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const book = await prisma.book.findUnique({ where: { id } })
    if (!book) return res.status(404).json({ message: "Book not found" });
    res.json(book);
});

// Add Book
app.post("/books", authMiddleware, async (req: Request, res: Response) => {
    const parsedData = BookSchema.safeParse(req.body);
    if (!parsedData.success) {
        return res.status(400).json({
            message: "Validation Error",
            errors: parsedData.error.issues,
        });
    }
    const { title, author, userid } = parsedData.data;

    const newBook = await prisma.book.create({
        data: { title, author, user: { connect: { id: userid } } }
    });
    res.status(201).json({ message: "Book added successfully", book: newBook });
});

// Update Book
app.put("/books/:id", authMiddleware, async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const book = await prisma.book.findUnique({ where: { id } });
    if (!book) return res.status(404).json({ message: "Book not found" });

    const parsedData = BookSchema.partial().safeParse(req.body);
    if (!parsedData.success) {
        return res.status(400).json({
            message: "Validation Error",
            errors: parsedData.error.issues,
        });
    }
    const { title, author } = parsedData.data;
    const updateBook = await prisma.book.update({ where: { id }, data: { title, author } });
    res.json({ message: "Book updated successfully", updateBook });
});

// Delete Book
app.delete("/books/:id", authMiddleware, async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    await prisma.book.delete({
        where: { id }
    })
    res.json({ message: "Book deleted successfully" });
});

// Upload Book Cover
app.post("/upload-book-cover", authMiddleware, upload.single("cover"), (req: Request, res: Response) => {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    res.json({
        message: "File uploaded successfully",
        filename: req.file.filename,
        path: req.file.path,
    });
});

// ==================== Auth Routes ====================

// Login Route
app.post("/login", async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const user = await prisma.user.findFirst({
        where: { email }
    });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ message: "Invalid credentials" });
    const accesstoken = jwt.sign({ email }, SECRET_KEY, { expiresIn: "15m" });
    const refreshtoken = jwt.sign({ email }, SECRET_KEY, { expiresIn: "7d" });
    refreshTokens.push(refreshtoken);

    res.json({
        message: "Login successful!",
        accesstoken,
        refreshtoken,
    });
});

// Refresh Token Route
app.post("/refresh", (req: Request, res: Response) => {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: "Refresh token required" });

    if (!refreshTokens.includes(token)) {
        return res.status(403).json({ message: "Invalid refresh token" });
    }

    jwt.verify(token, SECRET_KEY, (err: any, user: any) => {
        if (err) return res.status(403).json({ message: "Expired or invalid refresh token" });

        const accesstoken = jwt.sign(
            { username: (user as any).username },
            SECRET_KEY,
            { expiresIn: "15m" }
        );

        res.json({ accesstoken });
    });
});

// Logout Route
app.post("/logout", authMiddleware, (req: Request, res: Response) => {
    const { token } = req.body;
    refreshTokens = refreshTokens.filter((t) => t !== token);
    res.json({ message: "Logged out successfully" });
});

// Protected Profile Route
app.get("/profile", authMiddleware, (req: Request, res: Response) => {
    const user = (req as any).user;
    res.json({
        message: "Access granted to profile!",
        user,
    });
});

app.post('/user', async (req: Request, res: Response) => {
    const parsedData = SignupSchema.safeParse(req.body);
    if (!parsedData.success) return res.status(400).json({
        message: 'Validation Error',
        errors: parsedData.error.issues
    });
    const { name, email, password } = parsedData.data;
    const hashedpassword = await bcrypt.hash(password, 10);
    const existingUser = await prisma.user.findFirst({
        where: {
            email,
        }
    });
    if (existingUser) return res.status(400).json({ message: 'User Exist Already' });
    const newUser = await prisma.user.create({
        data: {
            name, email, password: hashedpassword
        }
    })
    res.status(201).json({
        message: 'User Created Successfully',
        user: newUser
    })
});

app.post('/users/:userId/books', authMiddleware, async (req: Request, res: Response) => {
    const userId = Number(req.params.userId);
    const parsedData = BookSchema.safeParse(req.body);
    if (!parsedData.success) {
        return res.status(400).json({ message: 'Invalid Credentials', errors: parsedData.error.issues })
    }
    const { title, author } = parsedData.data;

    const user = await prisma.user.findFirst({
        where: { id: userId }
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    const newBook = await prisma.book.create({
        data: { title, author, user: { connect: { id: userId } } }
    });
    res.status(201).json({
        message: "Book added successfully for the user",
        book: newBook,
    });
});

app.get('/book-with-users', authMiddleware, async (req: Request, res: Response) => {
    const books = await prisma.book.findMany({ include: { user: true } });
    res.json(books);
});

app.get('/users/:userId/books', authMiddleware, async (req: Request, res: Response) => {
    const userId = Number(req.params.userId);
    const userWithBooks = await prisma.user.findFirst({
        where: { id: userId },
        include: { book: true }
    });
    if (!userWithBooks) {
        return res.status(404).json({ message: "User not found" });
    }
    res.json(userWithBooks);
});

// ==================== Start Server ====================
app.listen(port, () => console.log(`Server running at Port ${port}`));