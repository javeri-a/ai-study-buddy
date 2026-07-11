import express from 'express';
import { protect } from '../middleware/auth.middleware';
import upload from '../config/multer';
import { uploadDocument, chatWithDocument, getDocuments, getDocumentById, createQuiz, deleteDocument, toggleFavorite } from '../controllers/document.controller';

const router = express.Router();

router.get('/', protect, getDocuments);
router.get('/:documentId', protect, getDocumentById);
router.post('/upload', protect, upload.single('file'), uploadDocument);
router.post('/:documentId/chat', protect, chatWithDocument);
router.post('/:documentId/quiz', protect, createQuiz);
router.delete('/:documentId', protect, deleteDocument);
router.patch('/:documentId/favorite', protect, toggleFavorite);

export default router;