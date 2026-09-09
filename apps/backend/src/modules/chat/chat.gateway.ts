import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  handleConnection(client: Socket) {
    const tenantId = client.handshake.query.tenantId as string;
    if (tenantId) {
      client.join(`tenant_${tenantId}`);
      this.logger.log(`Cliente conectado: ${client.id} na sala do tenant: tenant_${tenantId}`);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente desconectado: ${client.id}`);
  }

  @SubscribeMessage('join_conversation')
  handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.join(`conversation_${data.conversationId}`);
    this.logger.log(`Socket ${client.id} entrou na sala conversation_${data.conversationId}`);
  }

  @SubscribeMessage('leave_conversation')
  handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.leave(`conversation_${data.conversationId}`);
  }

  notifyNewMessage(tenantId: string, conversationId: string, message: any) {
    if (this.server) {
      this.server.to(`tenant_${tenantId}`).emit('new_message', { conversationId, message });
      this.server.to(`conversation_${conversationId}`).emit('new_message', { conversationId, message });
    }
  }

  notifyConversationUpdated(tenantId: string, conversation: any) {
    if (this.server) {
      this.server.to(`tenant_${tenantId}`).emit('conversation_updated', conversation);
    }
  }
}
