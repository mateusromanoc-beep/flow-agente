import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.webhookSubscription.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(tenantId: string, data: { url: string; events: string[]; secret?: string }) {
    return this.prisma.webhookSubscription.create({
      data: {
        tenantId,
        url: data.url,
        events: data.events,
        secret: data.secret,
      },
    });
  }

  async delete(id: string, tenantId: string) {
    return this.prisma.webhookSubscription.deleteMany({
      where: { id, tenantId },
    });
  }

  async triggerEvent(tenantId: string, event: string, payload: any) {
    const subscriptions = await this.prisma.webhookSubscription.findMany({
      where: { tenantId, isActive: true },
    });

    for (const sub of subscriptions) {
      const allowedEvents = (sub.events as string[]) || [];
      if (allowedEvents.includes(event) || allowedEvents.includes('*')) {
        // Dispara assincronamente sem travar o loop
        axios
          .post(
            sub.url,
            {
              event,
              timestamp: new Date().toISOString(),
              data: payload,
            },
            {
              headers: {
                'Content-Type': 'application/json',
                ...(sub.secret ? { 'x-signature': sub.secret } : {}),
              },
              timeout: 5000,
            }
          )
          .then(() => {
            this.logger.log(`Webhook [${event}] entregue com sucesso para: ${sub.url}`);
          })
          .catch((err) => {
            this.logger.warn(`Falha ao disparar webhook para ${sub.url}: ${err.message}`);
          });
      }
    }
  }
}
