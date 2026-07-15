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

// AI se answer generate karwata hai, given context ke sath, aur topic bhi tag karta hai
export const generateAnswer = async (question: string, context: string): Promise<{ answer: string; topic: string }> => {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY as string;

  const prompt = `You are a helpful study assistant. Answer the student's question using ONLY the context provided below. If the answer isn't in the context, say you don't have that information in the uploaded document.

Return ONLY a valid JSON object, no markdown, no code blocks, no extra text, in this exact format:
{"answer": "your answer here", "topic": "a short 2-4 word topic label for this question, e.g. 'SN1 vs SN2 reactions'"}

Context:
${context}

Question: ${question}`;

  let lastError: any = null;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await axios.post(
        `${BASE_URL}/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          contents: [{ parts: [{ text: prompt }] }],
        }
      );

      const rawText = response.data.candidates[0].content.parts[0].text;
      const cleanedText = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      return JSON.parse(cleanedText);
    } catch (error: any) {
      lastError = error;
      console.error(`generateAnswer attempt ${attempt} failed:`, error.response?.data?.error || error.message);
      if (attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  throw lastError;
};

// // Document ke content se multiple-choice quiz banata hai, optionally ek specific topic pe focus karke
// export const generateQuiz = async (documentText: string, topic?: string): Promise<any[]> => {
//   const GEMINI_API_KEY = process.env.GEMINI_API_KEY as string;

//   const focusInstruction = topic
//     ? `Focus specifically on the topic: "${topic}". Only generate questions related to this topic.`
//     : 'Cover a broad range of topics from the document.';

//   const prompt = `Based on the following document content, generate exactly ${topic ? 3 : 5} multiple-choice quiz questions to test understanding of the material. ${focusInstruction}

// Return ONLY a valid JSON array, with no markdown formatting, no code blocks, no extra text — just the raw JSON array. Each object must have this exact structure:
// {"question": "...", "options": ["...", "...", "...", "..."], "correctAnswer": 0}

// Where "correctAnswer" is the index (0-3) of the correct option in the "options" array.

// Document content:
// ${documentText}`;

//   let lastError: any = null;

//   for (let attempt = 1; attempt <= 2; attempt++) {
//     try {
//       const response = await axios.post(
//          `${BASE_URL}/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
       
//         {
//           contents: [{ parts: [{ text: prompt }] }],
//         }
//       );

//       const rawText = response.data.candidates[0].content.parts[0].text;
//       const cleanedText = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

//       return JSON.parse(cleanedText);
//     } catch (error: any) {
//       lastError = error;
//       console.error(`generateQuiz attempt ${attempt} failed:`, error.response?.data?.error || error.message);
//       if (attempt < 2) {
//         await new Promise((resolve) => setTimeout(resolve, 1000));
//       }
//     }
//   }

//   throw lastError;
// };


export const generateQuiz = async (
  documentText: string,
  topic?: string,
  difficulty: 'beginner' | 'advanced' | 'professional' = 'beginner'
): Promise<any[]> => {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY as string;

  const focusInstruction = topic
    ? `Focus specifically on the topic: "${topic}". Only generate questions related to this topic.`
    : 'Cover a broad range of topics from the document.';

  const difficultyInstruction = {
    beginner: 'Questions should be simple, testing basic recall and understanding of the material. Suitable for someone new to the topic.',
    advanced: 'Questions should require deeper understanding, connecting different parts of the material, and some analysis.',
    professional: 'Questions should be challenging, testing critical thinking, edge cases, and expert-level application of the material.',
  }[difficulty];

  const prompt = `Based on the following document content, generate exactly 15 multiple-choice quiz questions to test understanding of the material.

Difficulty level: ${difficulty.toUpperCase()}
${difficultyInstruction}

${focusInstruction}

Return ONLY a valid JSON array, with no markdown formatting, no code blocks, no extra text — just the raw JSON array. Each object must have this exact structure:
{"question": "...", "options": ["...", "...", "...", "..."], "correctAnswer": 0}

Where "correctAnswer" is the index (0-3) of the correct option in the "options" array.

Document content:
${documentText}`;

  let lastError: any = null;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await axios.post(
        `${BASE_URL}/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
        {
          contents: [{ parts: [{ text: prompt }] }],
        }
      );

      const rawText = response.data.candidates[0].content.parts[0].text;
      const cleanedText = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      return JSON.parse(cleanedText);
    } catch (error: any) {
      lastError = error;
      console.error(`generateQuiz attempt ${attempt} failed:`, error.response?.data?.error || error.message);
      if (attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  throw lastError;
};