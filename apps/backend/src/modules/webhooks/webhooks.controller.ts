import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Webhooks de Saída (Para CRMs e Sistemas Externos)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('webhooks')
export class WebhooksController {
  constructor(private webhooksService: WebhooksService) {}

  @ApiOperation({ summary: 'Listar webhooks cadastrados pelo tenant' })
  @Get()
  findAll(@Request() req) {
    return this.webhooksService.findAll(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Cadastrar nova URL de Webhook para receber eventos' })
  @Post()
  create(@Request() req, @Body() body: { url: string; events: string[]; secret?: string }) {
    return this.webhooksService.create(req.user.tenantId, body);
  }

  @ApiOperation({ summary: 'Excluir webhook cadastrado' })
  @Delete(':id')
  delete(@Request() req, @Param('id') id: string) {
    return this.webhooksService.delete(id, req.user.tenantId);
  }
}
