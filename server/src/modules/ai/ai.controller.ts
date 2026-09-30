import { Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../../config/db.js';
import { AuthenticatedRequest } from '../../middleware/authenticate.js';
import { AIOrchestrator } from '../../services/ai/AIOrchestrator.js';

export const chatWithAI = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const userName = req.user!.name;
    const { message, conversationId } = req.body;

    // Retrieve or create conversation
    let conv = conversationId
      ? await prisma.aiConversation.findFirst({
          where: { id: conversationId, userId },
          include: { messages: { orderBy: { createdAt: 'asc' }, take: 10 } },
        })
      : null;

    if (!conv) {
      conv = await prisma.aiConversation.create({
        data: {
          userId,
          title: message.slice(0, 40) + '...',
        },
        include: { messages: true },
      });
    }

    // Save user message
    await prisma.aiMessage.create({
      data: {
        conversationId: conv.id,
        role: 'user',
        content: message,
      },
    });

    const history = conv.messages.map((m) => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
    }));

    // Execute agentic loop
    const aiResponse = await AIOrchestrator.handleChat(userId, userName, message, history);

    // Save assistant message
    const savedAssistantMsg = await prisma.aiMessage.create({
      data: {
        conversationId: conv.id,
        role: 'assistant',
        content: aiResponse.content,
        toolMetadataJson: JSON.stringify({
          thoughtProcess: aiResponse.thoughtProcess,
          toolsUsed: aiResponse.toolsUsed,
          actionDraft: aiResponse.actionDraft,
        }),
      },
    });

    res.json({
      success: true,
      data: {
        conversationId: conv.id,
        messageId: savedAssistantMsg.id,
        role: 'assistant',
        content: aiResponse.content,
        thoughtProcess: aiResponse.thoughtProcess,
        toolsUsed: aiResponse.toolsUsed,
        actionDraft: aiResponse.actionDraft,
      },
    });
  } catch (error) {
    console.error('chatWithAI error:', error);
    res.status(500).json({ success: false, message: 'Gagal memproses percakapan dengan AI.' });
  }
};

export const getConversations = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const convs = await prisma.aiConversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { messages: true } },
      },
    });

    res.json({ success: true, data: convs });
  } catch (error) {
    console.error('getConversations error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil riwayat percakapan.' });
  }
};

export const getConversationById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;

    const conv = await prisma.aiConversation.findFirst({
      where: { id, userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conv) {
      res.status(404).json({ success: false, message: 'Percakapan tidak ditemukan.' });
      return;
    }

    res.json({ success: true, data: conv });
  } catch (error) {
    console.error('getConversationById error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil detail percakapan.' });
  }
};

export const deleteConversation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;

    const conv = await prisma.aiConversation.findFirst({
      where: { id, userId },
    });

    if (!conv) {
      res.status(404).json({ success: false, message: 'Percakapan tidak ditemukan.' });
      return;
    }

    await prisma.aiConversation.delete({ where: { id } });

    res.json({ success: true, message: 'Percakapan berhasil dihapus.' });
  } catch (error) {
    console.error('deleteConversation error:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus percakapan.' });
  }
};

export const confirmAIAction = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { actionType, payload } = req.body;

    if (actionType === 'CREATE_BUDGET') {
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

      const budget = await prisma.budget.create({
        data: {
          userId,
          name: payload.name || 'Anggaran Baru',
          amount: new Prisma.Decimal(payload.amount),
          periodStart,
          periodEnd,
          alertThreshold: payload.alertThreshold || 80,
        },
      });

      res.json({
        success: true,
        message: 'Anggaran berhasil dibuat sesuai rekomendasi AI! 🎯',
        data: budget,
      });
      return;
    }

    if (actionType === 'CREATE_SAVINGS_GOAL') {
      const targetDate = new Date();
      targetDate.setMonth(targetDate.getMonth() + 12);

      const goal = await prisma.savingsGoal.create({
        data: {
          userId,
          name: payload.name || 'Target Finansial AI',
          targetAmount: new Prisma.Decimal(payload.targetAmount || 10000000),
          currentAmount: new Prisma.Decimal(payload.currentAmount || 0),
          targetDate,
          priority: payload.priority || 'MEDIUM',
          icon: 'ShieldCheck',
        },
      });

      res.json({
        success: true,
        message: 'Tujuan tabungan berhasil didaftarkan! 🚀',
        data: goal,
      });
      return;
    }

    res.status(400).json({ success: false, message: 'Tipe tindakan aksi AI tidak didukung.' });
  } catch (error) {
    console.error('confirmAIAction error:', error);
    res.status(500).json({ success: false, message: 'Gagal menerapkan tindakan AI.' });
  }
};

export const getAIMemories = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const memories = await prisma.aiMemory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: memories });
  } catch (error) {
    console.error('getAIMemories error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil memori AI.' });
  }
};

export const deleteAIMemory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;

    await prisma.aiMemory.deleteMany({
      where: { id, userId },
    });

    res.json({ success: true, message: 'Memori AI berhasil dihapus.' });
  } catch (error) {
    console.error('deleteAIMemory error:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus memori AI.' });
  }
};

export const submitAIFeedback = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { messageId, rating, comment } = req.body;
    // Log user rating for model improvement
    console.log(`[AI Feedback] Msg ${messageId} rating: ${rating}, comment: ${comment || 'none'}`);
    res.json({ success: true, message: 'Terima kasih atas feedback Anda! 🙏' });
  } catch (error) {
    console.error('submitAIFeedback error:', error);
    res.status(500).json({ success: false, message: 'Gagal menyimpan feedback.' });
  }
};
