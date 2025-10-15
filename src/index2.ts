import express from "express";
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from "express-rate-limit";
import { ENV } from "./config/envConfig";
import userRouter from './routes/userRoutes';
import bookRouter from './routes/bookRoutes';

const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());
app.use(cors());
app.use(helmet());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});

app.use(limiter);


app.use('/api/v1/users', userRouter);
app.use('/api/v1/books', bookRouter);

app.use((err: any, req: any, res: any, next: any) => {
    console.error(err.stack);
    res.status(500).json({ message: "Something went wrong", error: err.message });
});

app.listen(port, () => console.log(`Server Running at Port ${port}`));