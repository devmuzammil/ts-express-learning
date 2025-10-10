import express, { Request, Response, NextFunction } from "express";
import { z } from "zod";
import path from "path";
import multer from "multer";
import jwt from "jsonwebtoken";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cors from 'cors';

const app = express();
const port = 3000;
const SECRET_KEY = "halry";
app.use(helmet());

app.use(express.json());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many request,please try again later . ',
});

app.use(limiter);

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
    year: z.number().min(1900, "Year must be valid"),
});

interface Book {
    id: number;
    title: string;
    author: string;
    year: number;
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
    { id: 1, title: "Atomic Habits", author: "James Clear", year: 2018 },
    { id: 2, title: "The Alchemist", author: "Paulo Coelho", year: 1988 },
];

app.use(logger);

// ==================== ROUTES ====================

// Home Route
app.get("/", (req: Request, res: Response) => {
    res.send("Welcome to Al-Hadi Book Store");
});

// Get All Books
app.get("/books", (req: Request, res: Response) => {
    res.json(books);
});

// Get Single Book
app.get("/books/:id", (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const book = books.find((b) => b.id === id);
    if (!book) return res.status(404).json({ message: "Book not found" });
    res.json(book);
});

// Add Book
app.post("/books", (req: Request, res: Response) => {
    const parsedData = BookSchema.safeParse(req.body);
    if (!parsedData.success) {
        return res.status(400).json({
            message: "Validation Error",
            errors: parsedData.error.issues,
        });
    }

    const newBook = { id: Date.now(), ...parsedData.data };
    books.push(newBook);
    res.status(201).json({ message: "Book added successfully", book: newBook });
});

// Update Book
app.put("/books/:id", (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const book = books.find((b) => b.id === id);
    if (!book) return res.status(404).json({ message: "Book not found" });

    const parsedData = BookSchema.partial().safeParse(req.body);
    if (!parsedData.success) {
        return res.status(400).json({
            message: "Validation Error",
            errors: parsedData.error.issues,
        });
    }

    Object.assign(book, parsedData.data);
    res.json({ message: "Book updated successfully", book });
});

// Delete Book
app.delete("/books/:id", (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const index = books.findIndex((b) => b.id === id);
    if (index === -1) return res.status(404).json({ message: "Book not found" });

    books.splice(index, 1);
    res.json({ message: "Book deleted successfully" });
});

// Upload Book Cover
app.post("/upload-book-cover", upload.single("cover"), (req: Request, res: Response) => {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    res.json({
        message: "File uploaded successfully",
        filename: req.file.filename,
        path: req.file.path,
    });
});

// ==================== Auth Routes ====================

// Login Route
app.post("/login", (req: Request, res: Response) => {
    const { username, password } = req.body;

    // Dummy user check
    if (username === "muzammil" && password === "1234") {
        const accesstoken = jwt.sign({ username }, SECRET_KEY, { expiresIn: "15m" });
        const refreshtoken = jwt.sign({ username }, SECRET_KEY, { expiresIn: "7d" });

        refreshTokens.push(refreshtoken);

        res.json({
            message: "Login successful!",
            accesstoken,
            refreshtoken,
        });
    } else {
        res.status(401).json({ message: "Invalid credentials" });
    }
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
app.post("/logout", (req: Request, res: Response) => {
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

// ==================== Start Server ====================
app.listen(port, () => console.log(`Server running at Port ${port}`));