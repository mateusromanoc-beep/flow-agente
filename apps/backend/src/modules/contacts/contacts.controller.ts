import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ContactsService } from './contacts.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Contatos & Tags')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('contacts')
export class ContactsController {
  constructor(private contactsService: ContactsService) {}

  @ApiOperation({ summary: 'Listar contatos do tenant' })
  @Get()
  findAll(@Request() req, @Query('search') search?: string) {
    return this.contactsService.findAll(req.user.tenantId, search);
  }

  @ApiOperation({ summary: 'Obter detalhes de um contato' })
  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.contactsService.findOne(id, req.user.tenantId);
  }

  @ApiOperation({ summary: 'Criar ou atualizar contato' })
  @Post()
  create(@Request() req, @Body() body: { name?: string; phoneNumber: string; email?: string }) {
    return this.contactsService.create(req.user.tenantId, body);
  }

  @ApiOperation({ summary: 'Listar todas as tags do tenant' })
  @Get('tags/list')
  getTags(@Request() req) {
    return this.contactsService.getTags(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Criar nova tag' })
  @Post('tags/create')
  createTag(@Request() req, @Body() body: { name: string; color?: string }) {
    return this.contactsService.createTag(req.user.tenantId, body.name, body.color);
  }

  @ApiOperation({ summary: 'Vincular tag ao contato' })
  @Post(':id/tags/:tagId')
  addTag(@Param('id') contactId: string, @Param('tagId') tagId: string) {
    return this.contactsService.addTag(contactId, tagId);
  }

  @ApiOperation({ summary: 'Remover tag do contato' })
  @Delete(':id/tags/:tagId')
  removeTag(@Param('id') contactId: string, @Param('tagId') tagId: string) {
    return this.contactsService.removeTag(contactId, tagId);
  }
}
