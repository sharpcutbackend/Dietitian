import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function sendMessageToGemini(
  message: string,
  history: Array<{ role: string; parts: Array<{ text: string }> }>
): Promise<string> {
  const chat = ai.chats.create({
    model: 'gemini-2.0-flash',
    history: history,
  });

  const response = await chat.sendMessage({ message: message });
  return response.text ?? '';
}
