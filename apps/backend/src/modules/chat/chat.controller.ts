import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ConversationStatus } from '@prisma/client';

@ApiTags('Atendimento & Chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @ApiOperation({ summary: 'Listar conversas do tenant' })
  @Get('conversations')
  getConversations(@Request() req, @Query('status') status?: ConversationStatus) {
    return this.chatService.getConversations(req.user.tenantId, status);
  }

  @ApiOperation({ summary: 'Obter histórico de mensagens de uma conversa' })
  @Get('conversations/:id/messages')
  getMessages(@Request() req, @Param('id') id: string) {
    return this.chatService.getConversationMessages(id, req.user.tenantId);
  }

  @ApiOperation({ summary: 'Enviar mensagem como atendente humano' })
  @Post('conversations/:id/messages')
  sendMessage(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { content: string },
  ) {
    return this.chatService.sendMessageAsAgent(id, req.user.id, body.content);
  }

  @ApiOperation({ summary: 'Adicionar nota interna na conversa' })
  @Post('conversations/:id/notes')
  addNote(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { content: string },
  ) {
    return this.chatService.addInternalNote(id, req.user.id, body.content);
  }

  @ApiOperation({ summary: 'Atualizar status da conversa (aberta, fechada, pendente)' })
  @Put('conversations/:id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: ConversationStatus },
  ) {
    return this.chatService.updateStatus(id, body.status);
  }
}
