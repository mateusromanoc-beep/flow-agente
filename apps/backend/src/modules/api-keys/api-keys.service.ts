import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { WebhooksService } from '../webhooks/webhooks.service';
import * as crypto from 'crypto';
import { MessageSenderType, MessageType, ConversationStatus } from '@prisma/client';

@Injectable()
export class ApiKeysService {
  constructor(
    private prisma: PrismaService,
    private whatsappService: WhatsappService,
    private webhooksService: WebhooksService,
  ) {}

  async findAll(tenantId: string) {
    return this.prisma.apiKey.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(tenantId: string, name: string) {
    const rawKey = `fa_${crypto.randomBytes(24).toString('hex')}`;
    return this.prisma.apiKey.create({
      data: {
        tenantId,
        name,
        key: rawKey,
        permissions: ['messages:send', 'contacts:read', 'contacts:write'],
      },
    });
  }

  async delete(id: string, tenantId: string) {
    return this.prisma.apiKey.deleteMany({
      where: { id, tenantId },
    });
  }

  // --- Rotas públicas consumidas por sistemas externos via API Key ---

  async sendExternalMessage(tenant: any, data: { number: string; text: string }) {
    const cleanNumber = data.number.replace(/\D/g, '');

    // Busca ou cria contato
    const contact = await this.prisma.contact.upsert({
      where: {
        tenantId_phoneNumber: {
          tenantId: tenant.id,
          phoneNumber: cleanNumber,
        },
      },
      create: {
        tenantId: tenant.id,
        phoneNumber: cleanNumber,
        name: `Lead ${cleanNumber}`,
      },
      update: {},
    });

    // Pega conexão ativa de WhatsApp
    const connection = await this.prisma.whatsappConnection.findFirst({
      where: { tenantId: tenant.id, isActive: true },
    });

    if (!connection) {
      throw new NotFoundException('Nenhuma conexão ativa de WhatsApp configurada para esta empresa.');
    }

    // Pega ou cria conversa
    let conversation = await this.prisma.conversation.findFirst({
      where: {
        tenantId: tenant.id,
        contactId: contact.id,
        whatsappConnectionId: connection.id,
      },
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          tenantId: tenant.id,
          contactId: contact.id,
          whatsappConnectionId: connection.id,
          status: ConversationStatus.OPEN,
        },
      });
    }

    // Cria registro da mensagem
    const message = await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderType: MessageSenderType.API,
        isFromMe: true,
        type: MessageType.TEXT,
        content: data.text,
      },
    });

    // Dispara via Evolution API
    await this.whatsappService.sendTextMessage(
      tenant.id,
      connection.instanceName,
      cleanNumber,
      data.text,
    );

    // Registra log de uso
    await this.prisma.usageLog.create({
      data: {
        tenantId: tenant.id,
        action: 'API_MESSAGE_SENT',
        quantity: 1,
      },
    });

    // Dispara webhook se cadastrado
    this.webhooksService.triggerEvent(tenant.id, 'api.message_sent', {
      contactId: contact.id,
      phoneNumber: cleanNumber,
      text: data.text,
      messageId: message.id,
    });

    return {
      success: true,
      messageId: message.id,
      conversationId: conversation.id,
      contact: { id: contact.id, phoneNumber: cleanNumber },
    };
  }
}
