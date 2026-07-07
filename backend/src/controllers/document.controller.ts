import { Response } from 'express';
import { PDFParse } from 'pdf-parse';
import DocumentModel from '../models/Document';
import Chunk from '../models/chunk';
import { AuthRequest } from '../middleware/auth.middleware';
import { splitIntoChunks } from '../utils/chunking';
import { generateEmbedding } from '../utils/gemini';

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

    // Document create karo, status "processing" ke sath
    const newDocument = await DocumentModel.create({
      userId: req.userId,
      title: req.file.originalname.replace('.pdf', ''),
      originalFileName: req.file.originalname,
      extractedText,
      status: 'processing',
    });

    // Text ko chunks mein todo
    const textChunks = splitIntoChunks(extractedText, 500);

    // Har chunk ki embedding banao aur database mein save karo
    for (let i = 0; i < textChunks.length; i++) {
      const embedding = await generateEmbedding(textChunks[i]);

      await Chunk.create({
        documentId: newDocument._id,
        text: textChunks[i],
        embedding,
        chunkIndex: i,
      });
    }

    // Ab document ka status "ready" kar do
    newDocument.status = 'ready';
    await newDocument.save();

    res.status(201).json({
      message: 'Document uploaded and processed successfully',
      document: {
        id: newDocument._id,
        title: newDocument.title,
        status: newDocument.status,
        totalChunks: textChunks.length,
        createdAt: newDocument.createdAt,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Server error during upload' });
  }
};