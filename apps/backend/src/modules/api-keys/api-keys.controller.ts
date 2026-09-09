import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { ApiKeysService } from './api-keys.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';

@ApiTags('Chaves de API & Integrações Externas')
@Controller()
export class ApiKeysController {
  constructor(private apiKeysService: ApiKeysService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Listar chaves de API da empresa (Tenant)' })
  @Get('api-keys')
  findAll(@Request() req) {
    return this.apiKeysService.findAll(req.user.tenantId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Gerar nova Chave de API' })
  @Post('api-keys')
  create(@Request() req, @Body() body: { name: string }) {
    return this.apiKeysService.create(req.user.tenantId, body.name);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Excluir Chave de API' })
  @Delete('api-keys/:id')
  delete(@Request() req, @Param('id') id: string) {
    return this.apiKeysService.delete(id, req.user.tenantId);
  }

  // --- API PÚBLICA PARA CRMs / SISTEMAS EXTERNOS ---

  @ApiHeader({ name: 'x-api-key', description: 'Chave de API da empresa (fa_...)' })
  @UseGuards(ApiKeyGuard)
  @ApiOperation({ summary: 'API Pública: Enviar mensagem WhatsApp via CRM/Sistema Externo' })
  @Post('v1/messages/send')
  sendExternalMessage(@Request() req, @Body() body: { number: string; text: string }) {
    return this.apiKeysService.sendExternalMessage(req.tenant, body);
  }
}
