import { Module } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { ApiKeysController } from './api-keys.controller';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { WebhooksModule } from '../webhooks/webhooks.module';

@Module({
  imports: [WhatsappModule, WebhooksModule],
  providers: [ApiKeysService],
  controllers: [ApiKeysController],
  exports: [ApiKeysService],
})
export class ApiKeysModule {}
