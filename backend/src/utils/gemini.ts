import axios from 'axios';

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

// Ek text chunk ko embedding (numbers ki list) mein badalta hai
export const generateEmbedding = async (text: string): Promise<number[]> => {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY as string;

  const response = await axios.post(
    `${BASE_URL}/models/gemini-embedding-001:embedContent?key=${GEMINI_API_KEY}`,
    {
      model: 'models/gemini-embedding-001',
      content: {
        parts: [{ text }],
      },
    }
  );

  return response.data.embedding.values;
};

// AI se answer generate karwata hai, given context ke sath
export const generateAnswer = async (question: string, context: string): Promise<string> => {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY as string;

  const prompt = `You are a helpful study assistant. Answer the student's question using ONLY the context provided below. If the answer isn't in the context, say you don't have that information in the uploaded document.

Context:
${context}

Question: ${question}

Answer:`;

  const response = await axios.post(
    `${BASE_URL}/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
    }
  );

  return response.data.candidates[0].content.parts[0].text;
};