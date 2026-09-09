import { Module, forwardRef } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { AiAgentModule } from '../ai-agent/ai-agent.module';
import { WebhooksModule } from '../webhooks/webhooks.module';

@Module({
  imports: [
    forwardRef(() => WhatsappModule),
    forwardRef(() => AiAgentModule),
    forwardRef(() => WebhooksModule),
  ],
  providers: [ChatService, ChatGateway],
  controllers: [ChatController],
  exports: [ChatService, ChatGateway],
})
export class ChatModule {}
