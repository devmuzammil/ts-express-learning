import express, { Request, Response, NextFunction } from "express";
const app = express();
const port = 3000;

app.get('/', (req: Request, res: Response, next: NextFunction) => {
    res.send(`Welcome to Al-Hadi Book Store`);
});

app.listen(port, () => console.log(`Server Running at Port ${port}`));