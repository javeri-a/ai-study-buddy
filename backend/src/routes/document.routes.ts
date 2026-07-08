import express from 'express';
import { protect } from '../middleware/auth.middleware';
import upload from '../config/multer';
import { uploadDocument, chatWithDocument, getDocuments, getDocumentById } from '../controllers/document.controller';

const router = express.Router();

router.get('/', protect, getDocuments);
router.get('/:documentId', protect, getDocumentById);
router.post('/upload', protect, upload.single('file'), uploadDocument);
router.post('/:documentId/chat', protect, chatWithDocument);

export default router;