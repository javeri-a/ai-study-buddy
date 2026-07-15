import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';

interface IChatMessage {
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

export interface IChat extends MongooseDocument {
  documentId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  messages: IChatMessage[];
}

const chatSchema = new Schema<IChat>({
  documentId: {
    type: Schema.Types.ObjectId,
    ref: 'Document',
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  messages: [
    {
      role: { type: String, enum: ['user', 'assistant'], required: true },
      content: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
    },
  ],
});

const Chat = mongoose.model<IChat>('Chat', chatSchema);

export default Chat;