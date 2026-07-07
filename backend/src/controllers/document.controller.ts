import { Response } from 'express';
import { PDFParse } from 'pdf-parse';
import DocumentModel from '../models/Document';
import { AuthRequest } from '../middleware/auth.middleware';

export const uploadDocument = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const parser = new PDFParse({ data: req.file.buffer });
    const textResult = await parser.getText();
    const extractedText = textResult.text;

    if (!extractedText || extractedText.trim().length === 0) {
      return res.status(400).json({ message: 'Could not extract text from this PDF' });
    }

    const newDocument = await DocumentModel.create({
      userId: req.userId,
      title: req.file.originalname.replace('.pdf', ''),
      originalFileName: req.file.originalname,
      extractedText,
      status: 'ready',
    });

    res.status(201).json({
      message: 'Document uploaded successfully',
      document: {
        id: newDocument._id,
        title: newDocument.title,
        status: newDocument.status,
        createdAt: newDocument.createdAt,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Server error during upload' });
  }
};