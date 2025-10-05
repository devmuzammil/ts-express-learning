import express, { Request, Response, NextFunction } from "express";
const app = express();
const port = 3000;
app.use(express.json());

interface Book {
    id: number,
    title: string,
    author: string,
    year: number
}

let books: Book[] = [
    { id: 1, title: 'Atomic Habits', author: "James Clear", year: 2018 },
    { id: 2, title: 'The Alchemist', author: "Paulo Coelho", year: 1988 }
]

app.get('/', (req: Request, res: Response, next: NextFunction) => {
    res.send(`Welcome to Al-Hadi Book Store`);
});

app.get('/books', (req: Request, res: Response, next: NextFunction) => {
    res.json(books);
});

app.get('/books/:id', (req: Request, res: Response, next: NextFunction) => {
    const id = Number(req.params.id);
    const book = books.find((b) => b.id === id);
    if (!book) return res.status(404).json({ message: 'Book not found' });
    res.json(book);
});

app.post('/books', (req: Request, res: Response, next: NextFunction) => {
    const { title, author, year } = req.body;
    const newBook = { id: Date.now(), title, author, year };
    books.push(newBook);
    res.status(201).json({ message: "Book added successfully", book: newBook });
});

app.put('/books/:id', (req: Request, res: Response, next: NextFunction) => {
    const id = Number(req.params.id);
    const { title, author, year } = req.body;
    const book = books.find(b => b.id === id);
    if (!book) return res.status(404).json({ message: 'Book not found' });

    book.title = title ?? book.title;
    book.author = author ?? book.author;
    book.year = year ?? book.year;
});

app.delete('/books/:id', (req: Request, res: Response, next: NextFunction) => {
    const id = Number(req.params.id);
    const index = books.findIndex(b => b.id === id);
    if (index === -1) return res.status(404).json({ message: 'Book not Found' });
    books.splice(index, 1);
    res.json({
        message: 'Book deleted Successfully'
    })
});
app.listen(port, () => console.log(`Server Running at Port ${port}`)); 