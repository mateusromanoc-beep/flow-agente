import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import Stripe from 'stripe';
import { SubscriptionStatus } from '@prisma/client';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private stripe: Stripe | null = null;

  constructor(private prisma: PrismaService) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (secretKey) {
      this.stripe = new Stripe(secretKey, {
        apiVersion: '2025-01-27.acacia' as any,
      });
    }
  }

  async getPlans() {
    return this.prisma.plan.findMany({
      orderBy: { priceMonthly: 'asc' },
    });
  }

  async getTenantSubscription(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        plan: true,
        _count: {
          select: {
            whatsappConnections: true,
            users: true,
          },
        },
      },
    });
    return tenant;
  }

  async createCheckoutSession(tenantId: string, planId: string, returnUrl: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });

    if (!plan || !tenant) {
      throw new Error('Plano ou Empresa não encontrados.');
    }

    if (!this.stripe) {
      // Simulação para ambiente local/desenvolvimento
      await this.prisma.tenant.update({
        where: { id: tenantId },
        data: {
          planId: plan.id,
          subscriptionStatus: SubscriptionStatus.ACTIVE,
        },
      });
      return { url: `${returnUrl}?status=success&simulated=true` };
    }

    // Cria sessão real no Stripe
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: `Plano ${plan.name} - Flow Agente`,
              description: plan.description || undefined,
            },
            unit_amount: Math.round(plan.priceMonthly * 100),
            recurring: { interval: 'month' },
          },
          quantity: 1,
        },
      ],
      metadata: {
        tenantId,
        planId,
      },
      success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}&status=success`,
      cancel_url: `${returnUrl}?status=cancelled`,
    });

    return { url: session.url };
  }

  async handleWebhook(signature: string, payload: Buffer) {
    if (!this.stripe) return { received: true };

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err) {
      this.logger.error(`Webhook signature verification failed: ${err.message}`);
      throw new Error(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const tenantId = session.metadata?.tenantId;
        const planId = session.metadata?.planId;

        if (tenantId && planId) {
          await this.prisma.tenant.update({
            where: { id: tenantId },
            data: {
              planId,
              subscriptionStatus: SubscriptionStatus.ACTIVE,
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
            },
          });
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await this.prisma.tenant.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: { subscriptionStatus: SubscriptionStatus.CANCELED },
        });
        break;
      }
    }

    return { received: true };
  }
}
