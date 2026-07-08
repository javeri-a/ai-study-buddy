import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';

interface IQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface IQuiz extends MongooseDocument {
  documentId: mongoose.Types.ObjectId;
  questions: IQuestion[];
  createdAt: Date;
}

const quizSchema = new Schema<IQuiz>({
  documentId: {
    type: Schema.Types.ObjectId,
    ref: 'Document',
    required: true,
  },
  questions: [
    {
      question: { type: String, required: true },
      options: { type: [String], required: true },
      correctAnswer: { type: Number, required: true },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Quiz = mongoose.model<IQuiz>('Quiz', quizSchema);

export default Quiz;