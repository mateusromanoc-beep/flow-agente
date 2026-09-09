import { Module, forwardRef } from '@nestjs/common';
import { AiAgentService } from './ai-agent.service';
import { AiAgentController } from './ai-agent.controller';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [forwardRef(() => WhatsappModule)],
  providers: [AiAgentService],
  controllers: [AiAgentController],
  exports: [AiAgentService],
})
export class AiAgentModule {}
