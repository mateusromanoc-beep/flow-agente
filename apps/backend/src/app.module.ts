import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { WhatsappModule } from './modules/whatsapp/whatsapp.module';
import { AiAgentModule } from './modules/ai-agent/ai-agent.module';
import { ChatModule } from './modules/chat/chat.module';
import { ContactsModule } from './modules/contacts/contacts.module';
import { ApiKeysModule } from './modules/api-keys/api-keys.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { BillingModule } from './modules/billing/billing.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    TenantsModule,
    WhatsappModule,
    AiAgentModule,
    ChatModule,
    ContactsModule,
    ApiKeysModule,
    WebhooksModule,
    BillingModule,
  ],
})
export class AppModule {}
