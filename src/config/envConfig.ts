import dotenv from 'dotenv';
dotenv.config();

if (!process.env.DATABASE_URL) {
    throw new Error('Database Url missing in .env file');
}

if (!process.env.SECRET_KEY) {
    throw new Error('No secret Key found');
}

export const ENV = {
    port: process.env.PORT || 3000,
    DATABASE_URL: process.env.DATABASE_URL,
    SECRET_KEY: process.env.SECRET_KEY,
    NODE_ENV: process.env.NODE_ENV || "development",
}