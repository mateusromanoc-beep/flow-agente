import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { GoogleGenAI } from '@google/genai';
import { MessageSenderType, MessageType, ConversationStatus } from '@prisma/client';

@Injectable()
export class AiAgentService {
  private readonly logger = new Logger(AiAgentService.name);
  private aiClient: GoogleGenAI | null = null;

  constructor(
    private prisma: PrismaService,
    private whatsappService: WhatsappService,
  ) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.aiClient = new GoogleGenAI({ apiKey });
    }
  }

  async getAgentConfig(tenantId: string) {
    let config = await this.prisma.agentConfig.findFirst({
      where: { tenantId },
    });

    if (!config) {
      config = await this.prisma.agentConfig.create({
        data: {
          tenantId,
          name: 'Alma - Assistente Virtual',
          promptSystem: `Você é uma assistente virtual acolhedora, empática e prestativa.\nResponda as dúvidas com clareza e gentileza.\nQuando o cliente quiser falar com um atendente humano, avise que vai transferir.`,
          modelName: 'gemini-1.5-flash',
          humanPauseMinutes: 300,
          splitDelimiter: '\\\\',
          messageDelaySeconds: 1,
        },
      });
    }
    return config;
  }

  async updateAgentConfig(tenantId: string, data: any) {
    const existing = await this.getAgentConfig(tenantId);
    return this.prisma.agentConfig.update({
      where: { id: existing.id },
      data,
    });
  }

  async processIncomingMessage(conversationId: string, userMessage: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        contact: true,
        tenant: true,
        whatsappConnection: true,
      },
    });

    if (!conversation) return null;

    const config = await this.getAgentConfig(conversation.tenantId);

    if (!config.isActive || !conversation.isAiHandling) {
      this.logger.log(`IA desativada para esta conversa ou empresa.`);
      return null;
    }

    // 1. Checa se a IA está pausada por atendimento humano
    const now = new Date();
    if (conversation.aiPausedUntil && conversation.aiPausedUntil > now) {
      this.logger.log(`IA pausada para conversa ${conversationId} até ${conversation.aiPausedUntil.toISOString()}`);
      return null;
    }

    // 2. Checa palavras-chave de transbordo para humano
    const keywords = (config.triggerHandoffKeywords || 'atendente,humano,falar com atendente,suporte')
      .split(',')
      .map(k => k.trim().toLowerCase());

    const lowerMsg = userMessage.toLowerCase();
    const shouldHandoff = keywords.some(k => k && lowerMsg.includes(k));

    if (shouldHandoff) {
      this.logger.log(`Transbordo acionado para humano na conversa ${conversationId}`);
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: {
          status: ConversationStatus.PENDING_HUMAN,
          isAiHandling: false,
          aiPausedUntil: new Date(Date.now() + config.humanPauseMinutes * 60 * 1000),
        },
      });

      const handoffMsg = "Entendido! Estou te transferindo agora mesmo para um de nossos atendentes humanos. Só um instante!";
      await this.sendAndRecordMessage(conversation, handoffMsg, config);
      return { action: 'handoff', message: handoffMsg };
    }

    // 3. Busca histórico recente de mensagens para memória de contexto
    const recentMessages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const conversationHistory = recentMessages
      .reverse()
      .map(m => `${m.senderType === MessageSenderType.CONTACT ? 'Cliente' : 'Assistente'}: ${m.content}`)
      .join('\n');

    // 4. Executa chamada ao Google Gemini
    let aiResponseText = "";
    try {
      if (this.aiClient) {
        const fullPrompt = `${config.promptSystem}\n\nInstrução importante: Se você precisar enviar mensagens em blocos separados para parecer natural no WhatsApp, use o delimitador '${config.splitDelimiter}' entre as mensagens.\n\nHistórico da conversa:\n${conversationHistory}\n\nCliente: ${userMessage}\nAssistente:`;

        const response = await this.aiClient.models.generateContent({
          model: config.modelName || 'gemini-1.5-flash',
          contents: fullPrompt,
          config: {
            temperature: config.temperature || 0.7,
          }
        });

        aiResponseText = response.text || "Olá! Como posso ajudar você hoje?";
      } else {
        // Fallback simulado caso API Key não esteja preenchida
        aiResponseText = `Olá, ${conversation.contact.name || 'tudo bem'}! Recebi sua mensagem: "${userMessage}". Como posso te orientar hoje? \\\\ Fique à vontade para tirar dúvidas!`;
      }
    } catch (err) {
      this.logger.error(`Erro ao consultar Gemini: ${err.message}`);
      aiResponseText = "Olá! Tive uma pequena oscilação no momento, mas já estou aqui para te ajudar. Pode repetir sua dúvida?";
    }

    // 5. Separa mensagens pelo delimitador configurado (ex: \\) e envia com delay
    const blocks = aiResponseText
      .split(config.splitDelimiter || '\\\\')
      .map(b => b.trim())
      .filter(b => b.length > 0);

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      await this.sendAndRecordMessage(conversation, block, config);

      if (i < blocks.length - 1 && config.messageDelaySeconds > 0) {
        await new Promise(resolve => setTimeout(resolve, config.messageDelaySeconds * 1000));
      }
    }

    return { action: 'replied', blocks };
  }

  private async sendAndRecordMessage(conversation: any, content: string, config: any) {
    // 1. Salva no banco de dados
    const msg = await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderType: MessageSenderType.AI,
        isFromMe: true,
        type: MessageType.TEXT,
        content,
      },
    });

    // 2. Dispara envio pelo WhatsApp (Evolution API)
    if (conversation.whatsappConnection?.instanceName) {
      await this.whatsappService.sendTextMessage(
        conversation.tenantId,
        conversation.whatsappConnection.instanceName,
        conversation.contact.phoneNumber,
        content,
      );
    }

    return msg;
  }

  async pauseAiForHumanIntervention(conversationId: string, minutes: number = 300) {
    const pauseUntil = new Date(Date.now() + minutes * 60 * 1000);
    return this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        aiPausedUntil: pauseUntil,
        status: ConversationStatus.HUMAN_ATTENDING,
      },
    });
  }

  async resumeAi(conversationId: string) {
    return this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        aiPausedUntil: null,
        isAiHandling: true,
        status: ConversationStatus.OPEN,
      },
    });
  }
}
