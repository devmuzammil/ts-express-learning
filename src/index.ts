import express from "express";
import cors from 'cors';
import helmet from 'helmet';
import { ENV } from "./config/envConfig";
import userRouter from './routes/userRoutes';
import bookRouter from './routes/bookRoutes';
import { errorMiddleware } from "./middlewares/error";
import { limiter } from "./middlewares/limiter";
import { graphqlHTTP } from "express-graphql";
import { schema, root } from './graphql/schema'


const app = express();
const port = ENV.port || 3000;

//Middlewares
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(limiter);

// REST API routes
app.use('/api/v1/users', userRouter);
app.use('/api/v1/books', bookRouter);

// GRAPHQL endpoint
app.use('/graphql', graphqlHTTP({ schema, rootValue: root, graphiql: true }));


// error Middleware
app.use(errorMiddleware);

app.listen(port, () => console.log(`Server Running at Port ${port}`));