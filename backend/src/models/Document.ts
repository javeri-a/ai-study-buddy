import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';

export interface IDocument extends MongooseDocument {
  userId: mongoose.Types.ObjectId;
  title: string;
  originalFileName: string;
  extractedText: string;
  status: 'processing' | 'ready' | 'failed';
  createdAt: Date;
}

const documentSchema = new Schema<IDocument>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  originalFileName: {
    type: String,
    required: true,
  },
  extractedText: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['processing', 'ready', 'failed'],
    default: 'processing',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const DocumentModel = mongoose.model<IDocument>('Document', documentSchema);

export default DocumentModel;