import { Controller, Get, Post, Body, Headers, Req, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Cobrança & Assinaturas (Stripe)')
@Controller('billing')
export class BillingController {
  constructor(private billingService: BillingService) {}

  @ApiOperation({ summary: 'Listar planos de assinatura disponíveis' })
  @Get('plans')
  getPlans() {
    return this.billingService.getPlans();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Consultar assinatura atual do tenant' })
  @Get('subscription')
  getSubscription(@Request() req) {
    return this.billingService.getTenantSubscription(req.user.tenantId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Iniciar Checkout de Assinatura no Stripe' })
  @Post('checkout')
  createCheckout(
    @Request() req,
    @Body() body: { planId: string; returnUrl?: string },
  ) {
    const returnUrl = body.returnUrl || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/billing`;
    return this.billingService.createCheckoutSession(req.user.tenantId, body.planId, returnUrl);
  }

  @ApiOperation({ summary: 'Webhook de eventos do Stripe' })
  @Post('webhook')
  handleWebhook(@Headers('stripe-signature') signature: string, @Req() req: any) {
    return this.billingService.handleWebhook(signature, req.rawBody || req.body);
  }
}
