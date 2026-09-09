import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WhatsappService } from './whatsapp.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('WhatsApp / Conexões')
@Controller('whatsapp')
export class WhatsappController {
  constructor(private whatsappService: WhatsappService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Listar conexões de WhatsApp da empresa' })
  @Get('connections')
  listConnections(@Request() req) {
    return this.whatsappService.listConnections(req.user.tenantId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Criar nova conexão e obter QR Code' })
  @Post('connections')
  createConnection(@Request() req, @Body() body: { name: string }) {
    return this.whatsappService.createConnection(req.user.tenantId, body.name);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Recarregar QR Code da conexão' })
  @Get('connections/:instanceName/qrcode')
  getQrCode(@Param('instanceName') instanceName: string) {
    return this.whatsappService.getQrCode(instanceName);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Deletar conexão de WhatsApp' })
  @Delete('connections/:id')
  deleteConnection(@Param('id') id: string) {
    return this.whatsappService.deleteConnection(id);
  }

  @ApiOperation({ summary: 'Webhook receptor da Evolution API' })
  @Post('webhook/:instanceName')
  handleWebhook(@Param('instanceName') instanceName: string, @Body() body: any) {
    return this.whatsappService.handleWebhook(instanceName, body);
  }
}
