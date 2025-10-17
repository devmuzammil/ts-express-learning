import { buildSchema } from "graphql";
import { prisma } from '../config/prismaClient';

// Graphql Schema

export const schema = buildSchema(`
    type User {
        id:ID!
        name:String
        email:String!
        books:[Book]
    }
    
    type Book {
        id:ID!
        title:String!
        author:String!
        user:User
    }
    
    type Query {
        books: [Book]
        book(id:ID!):Book
    }`);

// Graphql Resolvers( How to Fetch the Data )
export const root = {
    books: async () => { return await prisma.book.findMany({ include: { user: true } }); },
    book: async ({ id }: { id: number }) => {
        return await prisma.book.findFirst({ where: { id: Number(id) }, include: { user: true } });
    }
}