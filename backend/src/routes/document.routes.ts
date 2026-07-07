import express from 'express';
import { protect } from '../middleware/auth.middleware';
import upload from '../config/multer';
import { uploadDocument, chatWithDocument } from '../controllers/document.controller';

const router = express.Router();

router.post('/upload', protect, upload.single('file'), uploadDocument);
router.post('/:documentId/chat', protect, chatWithDocument);

export default router;