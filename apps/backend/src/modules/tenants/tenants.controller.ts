import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Empresas (Tenants)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tenants')
export class TenantsController {
  constructor(private tenantsService: TenantsService) {}

  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Listar todas as empresas (Apenas Super-Admin)' })
  @Get()
  findAll() {
    return this.tenantsService.findAll();
  }

  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Métricas gerais da plataforma (Apenas Super-Admin)' })
  @Get('metrics')
  getMetrics() {
    return this.tenantsService.getMetrics();
  }

  @ApiOperation({ summary: 'Obter detalhes de uma empresa' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tenantsService.findOne(id);
  }

  @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN)
  @ApiOperation({ summary: 'Atualizar dados de uma empresa' })
  @Put(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.tenantsService.update(id, data);
  }

  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Excluir uma empresa (Apenas Super-Admin)' })
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.tenantsService.delete(id);
  }
}
