import express from 'express';
import { protect } from '../middleware/auth.middleware';
import upload from '../config/multer';
import { uploadDocument } from '../controllers/document.controller';

const router = express.Router();

router.post('/upload', protect, upload.single('file'), uploadDocument);

export default router;