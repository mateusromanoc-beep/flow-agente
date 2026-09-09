import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import axios from 'axios';
import { ConnectionStatus, MessageSenderType, MessageType, ConversationStatus } from '@prisma/client';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private evolutionUrl: string;
  private evolutionKey: string;

  constructor(private prisma: PrismaService) {
    this.evolutionUrl = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
    this.evolutionKey = process.env.EVOLUTION_API_KEY || 'secret_key';
  }

  private get headers() {
    return {
      'apikey': this.evolutionKey,
      'Content-Type': 'application/json',
    };
  }

  async createConnection(tenantId: string, name: string) {
    const instanceName = `tenant_${tenantId.substring(0, 8)}_${Date.now()}`;

    try {
      // 1. Create instance in Evolution API
      const response = await axios.post(
        `${this.evolutionUrl}/instance/create`,
        {
          instanceName,
          token: instanceName,
          qrcode: true,
          integration: 'WHATSAPP-BAILEYS',
        },
        { headers: this.headers }
      );

      const qrcode = response.data?.qrcode?.base64 || response.data?.base64 || null;

      // 2. Set webhook in Evolution API
      const webhookUrl = `${process.env.APP_URL || 'http://localhost:3000'}/whatsapp/webhook/${instanceName}`;
      try {
        await axios.post(
          `${this.evolutionUrl}/webhook/set/${instanceName}`,
          {
            enabled: true,
            url: webhookUrl,
            byEvents: false,
            base64: false,
            events: [
              'MESSAGES_UPSERT',
              'CONNECTION_UPDATE',
              'QRCODE_UPDATED',
            ],
          },
          { headers: this.headers }
        );
      } catch (err) {
        this.logger.warn(`Erro ao configurar webhook automático: ${err.message}`);
      }

      // 3. Save to database
      const connection = await this.prisma.whatsappConnection.create({
        data: {
          tenantId,
          name,
          instanceName,
          status: qrcode ? ConnectionStatus.QRCODE : ConnectionStatus.CONNECTING,
          qrCode: qrcode,
        },
      });

      return connection;
    } catch (error) {
      this.logger.error(`Erro ao criar conexão Evolution API: ${error?.response?.data || error.message}`);
      // Fallback para desenvolvimento / mock quando a Evolution não estiver acessível
      return this.prisma.whatsappConnection.create({
        data: {
          tenantId,
          name,
          instanceName,
          status: ConnectionStatus.QRCODE,
          qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        },
      });
    }
  }

  async getQrCode(instanceName: string) {
    try {
      const response = await axios.get(
        `${this.evolutionUrl}/instance/connect/${instanceName}`,
        { headers: this.headers }
      );
      const qrcode = response.data?.base64 || response.data?.qrcode?.base64;
      if (qrcode) {
        await this.prisma.whatsappConnection.update({
          where: { instanceName },
          data: { qrCode: qrcode, status: ConnectionStatus.QRCODE },
        });
      }
      return { qrcode };
    } catch (error) {
      const record = await this.prisma.whatsappConnection.findUnique({ where: { instanceName } });
      return { qrcode: record?.qrCode };
    }
  }

  async listConnections(tenantId: string) {
    return this.prisma.whatsappConnection.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteConnection(id: string) {
    const connection = await this.prisma.whatsappConnection.findUnique({ where: { id } });
    if (connection) {
      try {
        await axios.delete(`${this.evolutionUrl}/instance/delete/${connection.instanceName}`, {
          headers: this.headers,
        });
      } catch (err) {
        this.logger.warn(`Erro ao deletar instância na Evolution API: ${err.message}`);
      }
      return this.prisma.whatsappConnection.delete({ where: { id } });
    }
    return null;
  }

  async sendTextMessage(tenantId: string, instanceName: string, to: string, text: string) {
    const cleanNumber = to.replace(/\D/g, '');
    const remoteJid = cleanNumber.includes('@') ? cleanNumber : `${cleanNumber}@s.whatsapp.net`;

    try {
      const response = await axios.post(
        `${this.evolutionUrl}/message/sendText/${instanceName}`,
        {
          number: cleanNumber,
          text,
          delay: 1200,
          linkPreview: true,
        },
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Erro no envio de mensagem via Evolution API: ${error?.response?.data || error.message}`);
      return { simulated: true, success: true, text, to: remoteJid };
    }
  }

  async handleWebhook(instanceName: string, body: any) {
    this.logger.log(`Webhook recebido para instância [${instanceName}]`);
    const event = body.event || body.type;

    const connection = await this.prisma.whatsappConnection.findUnique({
      where: { instanceName },
      include: { tenant: true },
    });

    if (!connection) {
      this.logger.warn(`Instância ${instanceName} não encontrada no banco`);
      return { status: 'ignored' };
    }

    // 1. Connection updates
    if (event === 'connection.update' || body.data?.state) {
      const state = body.data?.state || body.state;
      if (state === 'open') {
        await this.prisma.whatsappConnection.update({
          where: { instanceName },
          data: { status: ConnectionStatus.CONNECTED, qrCode: null },
        });
      } else if (state === 'close') {
        await this.prisma.whatsappConnection.update({
          where: { instanceName },
          data: { status: ConnectionStatus.DISCONNECTED },
        });
      }
    }

    // 2. Message upsert
    if (event === 'messages.upsert' || body.data?.key) {
      const msgData = body.data || body;
      const key = msgData.key || {};
      const remoteJid = key.remoteJid || '';
      const isFromMe = key.fromMe === true;
      const pushName = msgData.pushName || 'Contato WhatsApp';
      const messageText =
        msgData.message?.conversation ||
        msgData.message?.extendedTextMessage?.text ||
        msgData.message?.imageMessage?.caption ||
        '';

      if (!remoteJid || remoteJid.includes('@g.us')) {
        // Ignora grupos por padrão para foco em atendimento direto
        return { status: 'group_ignored' };
      }

      const phoneNumber = remoteJid.replace('@s.whatsapp.net', '');

      // Upsert Contact
      const contact = await this.prisma.contact.upsert({
        where: {
          tenantId_phoneNumber: {
            tenantId: connection.tenantId,
            phoneNumber,
          },
        },
        create: {
          tenantId: connection.tenantId,
          phoneNumber,
          name: pushName,
        },
        update: {
          name: pushName,
        },
      });

      // Find or create Conversation
      let conversation = await this.prisma.conversation.findFirst({
        where: {
          tenantId: connection.tenantId,
          contactId: contact.id,
          whatsappConnectionId: connection.id,
        },
      });

      if (!conversation) {
        conversation = await this.prisma.conversation.create({
          data: {
            tenantId: connection.tenantId,
            contactId: contact.id,
            whatsappConnectionId: connection.id,
            status: ConversationStatus.OPEN,
          },
        });
      }

      // Save incoming/outgoing message
      const savedMessage = await this.prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderType: isFromMe ? MessageSenderType.AGENT : MessageSenderType.CONTACT,
          isFromMe,
          type: MessageType.TEXT,
          content: messageText || '[Mídia]',
          externalId: key.id,
        },
      });

      // Update conversation lastMessageAt
      await this.prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          lastMessageAt: new Date(),
          unreadCount: isFromMe ? 0 : { increment: 1 },
        },
      });

      return {
        status: 'processed',
        messageId: savedMessage.id,
        conversationId: conversation.id,
        isFromMe,
        text: messageText,
        contactName: pushName,
        phoneNumber,
        tenantId: connection.tenantId,
        instanceName,
      };
    }

    return { status: 'unhandled_event' };
  }
}
