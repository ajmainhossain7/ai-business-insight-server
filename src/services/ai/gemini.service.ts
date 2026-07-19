import { GoogleGenerativeAI, GenerativeModel, GenerationConfig } from '@google/generative-ai';
import { logger } from '../../utils/logger.utils';
import { GeminiGenerateOptions } from '../../types/ai.types';

// ============================================================
// Gemini AI Service Client
// ============================================================
// TODO: Set GEMINI_API_KEY in your .env file
//       Get your key from: https://aistudio.google.com/app/apikey
// ============================================================

let genAI: GoogleGenerativeAI | null = null;

function getGeminiClient(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // TODO: Remove this warning once GEMINI_API_KEY is configured
      logger.warn('⚠️  GEMINI_API_KEY not set. AI features will return mock data.');
      throw new Error('Gemini API key not configured. Set GEMINI_API_KEY in .env');
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

function getModel(modelName?: string): GenerativeModel {
  const client = getGeminiClient();
  // gemini-1.5-flash is stable, fast, and available on the v1beta API
  const model = modelName || process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  return client.getGenerativeModel({ model });
}

export async function generateText(
  prompt: string,
  options: GeminiGenerateOptions = {}
): Promise<string> {
  const model = getModel();

  const generationConfig: GenerationConfig = {
    temperature: options.temperature ?? 0.7,
    maxOutputTokens: options.maxOutputTokens ?? 8192,
    topK: options.topK ?? 40,
    topP: options.topP ?? 0.95,
  };

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig,
    });

    const response = result.response;
    return response.text();
  } catch (error) {
    logger.error('Gemini generateText error:', error);
    throw new Error(`AI generation failed: ${(error as Error).message}`);
  }
}

export async function generateJSON<T>(
  prompt: string,
  options: GeminiGenerateOptions = {}
): Promise<T> {
  const jsonPrompt = `${prompt}

IMPORTANT: Respond ONLY with valid JSON. Do not include markdown code blocks, explanations, or any text outside of the JSON object.`;

  const text = await generateText(jsonPrompt, {
    ...options,
    temperature: options.temperature ?? 0.3, // Lower temperature for structured output
  });

  try {
    // Strip markdown code blocks if present
    const cleaned = text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    return JSON.parse(cleaned) as T;
  } catch (error) {
    logger.error('Failed to parse Gemini JSON response:', { text, error });
    throw new Error('AI returned invalid JSON. Please try again.');
  }
}

export async function generateChatResponse(
  systemPrompt: string,
  conversationHistory: { role: 'user' | 'model'; text: string }[],
  userMessage: string,
  options: GeminiGenerateOptions = {}
): Promise<string> {
  const model = getModel();

  const generationConfig: GenerationConfig = {
    temperature: options.temperature ?? 0.8,
    maxOutputTokens: options.maxOutputTokens ?? 4096,
  };

  const contents = [
    // System context as first user message
    { role: 'user' as const, parts: [{ text: systemPrompt }] },
    { role: 'model' as const, parts: [{ text: 'Understood. I am ready to help analyze this business report.' }] },
    // Previous conversation
    ...conversationHistory.map((msg) => ({
      role: msg.role as 'user' | 'model',
      parts: [{ text: msg.text }],
    })),
    // Current message
    { role: 'user' as const, parts: [{ text: userMessage }] },
  ];

  try {
    const result = await model.generateContent({ contents, generationConfig });
    return result.response.text();
  } catch (error) {
    logger.error('Gemini chat error:', error);
    throw new Error(`Chat AI failed: ${(error as Error).message}`);
  }
}

export const geminiService = {
  generateText,
  generateJSON,
  generateChatResponse,
};
