import { Router } from "express";
import { createBook, getBook, getBookbyId, updateBook, deleteBook } from '../controllers/bookController';
import { authMiddleware } from '../middlewares/auth'

const router = Router();

router.use(authMiddleware);

router.post('/', createBook);
router.get('/', getBook);
router.get('/:id', getBookbyId);
router.post('/:id', updateBook);
router.post('/:id', deleteBook);

export default router;