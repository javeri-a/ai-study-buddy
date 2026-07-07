import mongoose, { Schema, Document } from 'mongoose';

export interface IChunk extends Document {
  documentId: mongoose.Types.ObjectId;
  text: string;
  embedding: number[];
  chunkIndex: number;
}

const chunkSchema = new Schema<IChunk>({
  documentId: {
    type: Schema.Types.ObjectId,
    ref: 'Document',
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  embedding: {
    type: [Number],
    required: true,
  },
  chunkIndex: {
    type: Number,
    required: true,
  },
});

const Chunk = mongoose.model<IChunk>('Chunk', chunkSchema);

export default Chunk;