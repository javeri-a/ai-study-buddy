import { Response } from 'express';
import { PDFParse } from 'pdf-parse';
import DocumentModel from '../models/Document';
import Chunk from '../models/chunk';
import Quiz from '../models/Quiz';
import { AuthRequest } from '../middleware/auth.middleware';
import { splitIntoChunks } from '../utils/chunking';
import { generateEmbedding, generateAnswer, generateQuiz } from '../utils/gemini';
import { cosineSimilarity } from '../utils/similarity';

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

    const fixedFileName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');

    const newDocument = await DocumentModel.create({
      userId: req.userId,
      title: fixedFileName.replace('.pdf', ''),
      originalFileName: fixedFileName,
      extractedText,
      status: 'processing',
    });

    const textChunks = splitIntoChunks(extractedText, 500);

    for (let i = 0; i < textChunks.length; i++) {
      const embedding = await generateEmbedding(textChunks[i]);

      await Chunk.create({
        documentId: newDocument._id,
        text: textChunks[i],
        embedding,
        chunkIndex: i,
      });
    }

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

export const chatWithDocument = async (req: AuthRequest, res: Response) => {
  try {
    const { documentId } = req.params;
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ message: 'Question is required' });
    }

    const document = await DocumentModel.findOne({ _id: documentId, userId: req.userId });
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const questionEmbedding = await generateEmbedding(question);

    const chunks = await Chunk.find({ documentId });

    if (chunks.length === 0) {
      return res.status(400).json({ message: 'No content found for this document' });
    }

    const scoredChunks = chunks.map((chunk) => ({
      text: chunk.text,
      score: cosineSimilarity(questionEmbedding, chunk.embedding),
    }));

    scoredChunks.sort((a, b) => b.score - a.score);
    const topChunks = scoredChunks.slice(0, 3);

    const context = topChunks.map((c) => c.text).join('\n\n');

    const answer = await generateAnswer(question, context);

    res.status(200).json({
      answer,
      question,
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ message: 'Server error during chat' });
  }
};

export const getDocuments = async (req: AuthRequest, res: Response) => {
  try {
    const documents = await DocumentModel.find({ userId: req.userId }).sort({ createdAt: -1 });

    res.status(200).json({
      documents: documents.map((doc) => ({
        id: doc._id,
        title: doc.title,
        status: doc.status,
        createdAt: doc.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ message: 'Server error fetching documents' });
  }
};

export const getDocumentById = async (req: AuthRequest, res: Response) => {
  try {
    const { documentId } = req.params;
    const document = await DocumentModel.findOne({ _id: documentId, userId: req.userId });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    res.status(200).json({
      document: {
        id: document._id,
        title: document.title,
        status: document.status,
        createdAt: document.createdAt,
      },
    });
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ message: 'Server error fetching document' });
  }
};

export const createQuiz = async (req: AuthRequest, res: Response) => {
  try {
    const { documentId } = req.params;

    const document = await DocumentModel.findOne({ _id: documentId, userId: req.userId });
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const questions = await generateQuiz(document.extractedText);

    const newQuiz = new Quiz({
      documentId,
      questions,
    });
    await newQuiz.save();

    res.status(201).json({
      message: 'Quiz generated successfully',
      quiz: {
        id: newQuiz._id,
        questions: newQuiz.questions,
      },
    });
  } catch (error) {
    console.error('Quiz generation error:', error);
    res.status(500).json({ message: 'Server error generating quiz' });
  }
};