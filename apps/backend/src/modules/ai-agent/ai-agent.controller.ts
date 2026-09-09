import { Controller, Get, Put, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AiAgentService } from './ai-agent.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Agente de IA')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('agent-config')
export class AiAgentController {
  constructor(private aiAgentService: AiAgentService) {}

  @ApiOperation({ summary: 'Obter configuração do agente de IA da empresa' })
  @Get()
  getConfig(@Request() req) {
    return this.aiAgentService.getAgentConfig(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Atualizar configuração do agente de IA' })
  @Put()
  updateConfig(@Request() req, @Body() data: any) {
    return this.aiAgentService.updateAgentConfig(req.user.tenantId, data);
  }

  @ApiOperation({ summary: 'Pausar IA para atendimento humano nesta conversa' })
  @Post('pause/:conversationId')
  pauseAi(@Param('conversationId') conversationId: string, @Body() body: { minutes?: number }) {
    return this.aiAgentService.pauseAiForHumanIntervention(conversationId, body.minutes);
  }

  @ApiOperation({ summary: 'Reativar IA nesta conversa' })
  @Post('resume/:conversationId')
  resumeAi(@Param('conversationId') conversationId: string) {
    return this.aiAgentService.resumeAi(conversationId);
  }
}
