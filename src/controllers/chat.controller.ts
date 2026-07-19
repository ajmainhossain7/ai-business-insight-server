import { Request, Response, NextFunction } from 'express';
import { ChatModel } from '../models/Chat.model';
import { ReportModel } from '../models/Report.model';
import { chatAiService, SUGGESTED_PROMPTS } from '../services/ai/chat.service';
import { sendSuccess, sendNotFound, sendError } from '../utils/response.utils';
import { ChatContext } from '../types/ai.types';

// ============================================================
// Chat Controller — Context-Aware AI Chat per Report
// ============================================================

// GET /api/chat/:reportId/suggested-prompts
export async function getSuggestedPrompts(_req: Request, res: Response): Promise<void> {
  sendSuccess(res, { prompts: SUGGESTED_PROMPTS });
}

// POST /api/chat/:reportId — send message to AI
export async function sendMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { reportId } = req.params;
    const userId = req.user!._id;
    const { message } = req.body;

    if (!message?.trim()) {
      sendError(res, 'Message is required', 400);
      return;
    }

    // Fetch report to build context
    const report = await ReportModel.findById(reportId);
    if (!report) {
      sendNotFound(res, 'Report not found');
      return;
    }

    // Verify access (owner or public report)
    if (!report.isPublic && report.userId.toString() !== userId.toString()) {
      sendError(res, 'Access denied to this report', 403);
      return;
    }

    // Load or create chat session
    let chat = await ChatModel.findOne({ userId, reportId });
    if (!chat) {
      chat = await ChatModel.create({
        userId,
        reportId,
        messages: [],
        title: `Chat about: ${report.title}`,
      });
    }

    // Build AI context from report data
    const context: ChatContext = {
      reportTitle: report.title,
      reportSummary: report.executiveSummary || report.shortDescription || 'No summary available.',
      businessHealth: report.businessHealth,
      keyMetrics: (report.keyMetrics as Record<string, string | number>) || {},
      kpis: report.kpis || [],
      insights: report.insights || [],
      risks: report.risks || [],
      recommendations: report.recommendations || [],
    };

    // Add user message to history
    const userMsg = { role: 'user' as const, content: message.trim(), timestamp: new Date() };
    chat.messages.push(userMsg);

    // Generate AI response with full context + conversation history
    const aiResponse = await chatAiService.sendChatMessage(context, chat.messages.slice(0, -1), message.trim());

    // Add AI response to history
    const assistantMsg = { role: 'assistant' as const, content: aiResponse, timestamp: new Date() };
    chat.messages.push(assistantMsg);

    // Update token count (rough estimate)
    chat.tokenCount = (chat.tokenCount || 0) + Math.ceil((message.length + aiResponse.length) / 4);
    await chat.save();

    sendSuccess(res, {
      userMessage: userMsg,
      assistantMessage: assistantMsg,
      chatId: chat._id,
    }, 'Message sent successfully');
  } catch (error) {
    next(error);
  }
}

// GET /api/chat/:reportId/history — conversation history
export async function getChatHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { reportId } = req.params;
    const userId = req.user!._id;

    const chat = await ChatModel.findOne({ userId, reportId });
    if (!chat) {
      sendSuccess(res, { messages: [], chatId: null });
      return;
    }

    sendSuccess(res, {
      chatId: chat._id,
      messages: chat.messages,
      title: chat.title,
      messageCount: chat.messages.length,
    });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/chat/:reportId — clear conversation
export async function clearChatHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { reportId } = req.params;
    const userId = req.user!._id;

    await ChatModel.findOneAndUpdate(
      { userId, reportId },
      { $set: { messages: [], tokenCount: 0 } }
    );

    sendSuccess(res, {}, 'Chat history cleared');
  } catch (error) {
    next(error);
  }
}
