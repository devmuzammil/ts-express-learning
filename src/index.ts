
import express, { Request, Response, NextFunction } from "express";
const app = express();
app.use(express.json());
const port = 3000;

app.get('/', (req: Request, res: Response, next: NextFunction) => {
    res.send('Welcome to Express+TS Journey');
});

app.get('/homepage', (req: Request, res: Response, next: NextFunction) => {
    res.send('Hello from Homepage');
});
app.listen(port, () => console.log(`Server is Running at Port ${port}`));