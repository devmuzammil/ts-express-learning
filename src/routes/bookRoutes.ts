import { Router } from "express";
import { createBook, getBook, getBookbyId, updateBook, deleteBook } from '../controllers/bookController';

const router = Router();

router.post('/', createBook);
router.get('/', getBook);
router.get('/:id', getBookbyId);
router.post('/:id', updateBook);
router.post('/:id', deleteBook);

export default router;