import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ChatGateway } from './chat.gateway';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { AiAgentService } from '../ai-agent/ai-agent.service';
import { WebhooksService } from '../webhooks/webhooks.service';
import { MessageSenderType, MessageType, ConversationStatus } from '@prisma/client';

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private chatGateway: ChatGateway,
    private whatsappService: WhatsappService,
    private aiAgentService: AiAgentService,
    private webhooksService: WebhooksService,
  ) {}

  async getConversations(tenantId: string, status?: ConversationStatus) {
    return this.prisma.conversation.findMany({
      where: {
        tenantId,
        ...(status ? { status } : {}),
      },
      include: {
        contact: {
          include: {
            contactTags: {
              include: { tag: true },
            },
          },
        },
        assignedUser: {
          select: { id: true, name: true, email: true },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    });
  }

  async getConversationMessages(conversationId: string, tenantId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, tenantId },
      include: {
        contact: {
          include: {
            contactTags: {
              include: { tag: true },
            },
          },
        },
        assignedUser: true,
        whatsappConnection: true,
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversa não encontrada.');
    }

    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });

    const notes = await this.prisma.internalNote.findMany({
      where: { conversationId },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'asc' },
    });

    // Reset unread count
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { unreadCount: 0 },
    });

    return {
      conversation,
      messages,
      notes,
    };
  }

  async sendMessageAsAgent(
    conversationId: string,
    userId: string,
    content: string,
  ) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        whatsappConnection: true,
        contact: true,
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversa não encontrada.');
    }

    // 1. Cria a mensagem do atendente no banco
    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderType: MessageSenderType.AGENT,
        senderUserId: userId,
        isFromMe: true,
        type: MessageType.TEXT,
        content,
      },
    });

    // 2. Pausa a IA automaticamente (Intervenção Humana detectada)
    await this.aiAgentService.pauseAiForHumanIntervention(conversationId, 300);

    // 3. Atualiza status da conversa
    const updatedConversation = await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        status: ConversationStatus.HUMAN_ATTENDING,
        assignedUserId: userId,
      },
    });

    // 4. Envia para o WhatsApp via Evolution API
    if (conversation.whatsappConnection?.instanceName) {
      await this.whatsappService.sendTextMessage(
        conversation.tenantId,
        conversation.whatsappConnection.instanceName,
        conversation.contact.phoneNumber,
        content,
      );
    }

    // 5. Notifica via WebSocket
    this.chatGateway.notifyNewMessage(conversation.tenantId, conversationId, message);
    this.chatGateway.notifyConversationUpdated(conversation.tenantId, updatedConversation);

    // 6. Dispara Webhook Externo
    this.webhooksService.triggerEvent(conversation.tenantId, 'message.sent', {
      conversationId,
      message,
      contact: conversation.contact,
    });

    return message;
  }

  async addInternalNote(conversationId: string, userId: string, content: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) {
      throw new NotFoundException('Conversa não encontrada.');
    }

    return this.prisma.internalNote.create({
      data: {
        conversationId,
        contactId: conversation.contactId,
        userId,
        content,
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });
  }

  async updateStatus(conversationId: string, status: ConversationStatus) {
    const updated = await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { status },
    });
    this.chatGateway.notifyConversationUpdated(updated.tenantId, updated);
    return updated;
  }
}
