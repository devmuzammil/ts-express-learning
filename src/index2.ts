import express from "express";
import cors from 'cors';
import helmet from 'helmet';
import { ENV } from "./config/envConfig";
import userRouter from './routes/userRoutes';
import bookRouter from './routes/bookRoutes';
import { errorMiddleware } from "./middlewares/error";
import { limiter } from "./middlewares/limiter";


const app = express();
const port = ENV.port || 3000;
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(limiter);


app.use('/api/v1/users', userRouter);
app.use('/api/v1/books', bookRouter);

app.use(errorMiddleware);

app.listen(port, () => console.log(`Server Running at Port ${port}`));