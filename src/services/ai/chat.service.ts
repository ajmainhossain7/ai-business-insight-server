import { generateChatResponse } from './gemini.service';
import { ChatContext, ChatMessage } from '../../types/ai.types';
import { logger } from '../../utils/logger.utils';

// ============================================================
// Context-Aware AI Chat Service
// Each report has its own AI assistant with full context
// ============================================================

export const SUGGESTED_PROMPTS = [
  'Why did revenue decrease recently?',
  'Which products or segments performed best?',
  'What are the top 3 risks I should address?',
  'Give me a 90-day action plan based on this data.',
  'What growth opportunities should I prioritize?',
  'How does our business health compare to benchmarks?',
  'What marketing strategies would improve performance?',
  'Summarize the key findings for my executive team.',
];

function buildSystemPrompt(context: ChatContext): string {
  const kpiText = context.kpis
    .map((k) => `  - ${k.name}: ${k.value}${k.unit ? ' ' + k.unit : ''}${k.trend ? ' (Trend: ' + k.trend + ')' : ''}`)
    .join('\n');

  const metricsText = Object.entries(context.keyMetrics)
    .map(([k, v]) => `  - ${k}: ${v}`)
    .join('\n');

  const insightsText = context.insights
    .slice(0, 5)
    .map((i) => `  - [${i.importance.toUpperCase()}] ${i.title}: ${i.description.slice(0, 150)}...`)
    .join('\n');

  const risksText = context.risks
    .slice(0, 3)
    .map((r) => `  - [${r.severity.toUpperCase()}] ${r.title}: ${r.description.slice(0, 100)}`)
    .join('\n');

  const recsText = context.recommendations
    .slice(0, 4)
    .map((r, i) => `  ${i + 1}. ${r.slice(0, 120)}`)
    .join('\n');

  return `You are an expert Business Intelligence AI assistant analyzing a specific business report. You have full access to the report data and must provide accurate, data-driven answers.

REPORT CONTEXT:
Title: ${context.reportTitle}
Business Health: ${context.businessHealth || 'Unknown'}

Executive Summary:
${context.reportSummary}

Key Performance Indicators:
${kpiText || '  No KPIs available'}

Key Metrics:
${metricsText || '  No metrics available'}

AI-Generated Insights:
${insightsText || '  No insights available'}

Identified Risks:
${risksText || '  No risks identified'}

Recommendations:
${recsText || '  No recommendations available'}

YOUR INSTRUCTIONS:
- Answer questions using ONLY data from this specific report context above
- Be specific, cite actual numbers and metrics from the data
- For trend questions, reference the KPIs and their trend indicators
- For strategy questions, base recommendations on the actual risks and opportunities
- Format responses clearly with bullet points or numbered lists when helpful
- If asked about something not in this report, say so clearly and redirect
- Keep responses concise but thorough — executives need clarity, not fluff
- Use business language appropriate for C-suite communication
- When analyzing problems, apply the MECE principle (Mutually Exclusive, Collectively Exhaustive)
- Always suggest a next step or follow-up action`;
}

export async function sendChatMessage(
  context: ChatContext,
  conversationHistory: ChatMessage[],
  userMessage: string
): Promise<string> {
  logger.info(`Processing chat message for report: "${context.reportTitle}"`);

  try {
    const systemPrompt = buildSystemPrompt(context);

    // Convert chat history to Gemini format (max last 10 messages for context window)
    const recentHistory = conversationHistory.slice(-10);
    const history = recentHistory.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : ('user' as 'user' | 'model'),
      text: msg.content,
    }));

    const response = await generateChatResponse(systemPrompt, history, userMessage, {
      temperature: 0.6,
      maxOutputTokens: 2048,
    });

    return response;
  } catch (error) {
    logger.error('Chat service error, returning setup guide:', error);
    return `### 💡 AI Assistant Setup Required\n\nI couldn't process your message because the Gemini API is currently unavailable or the API key is not configured.\n\n**To enable full context-aware chat:**\n1. Sign up for a free API Key at [Google AI Studio](https://aistudio.google.com/)\n2. Add your key to the backend \`.env\` file: \`GEMINI_API_KEY=your_key\`\n3. Restart the backend server\n\n*Original question: "${userMessage}"*`;
  }
}

export const chatAiService = {
  sendChatMessage,
  SUGGESTED_PROMPTS,
};
