import { Controller, Post, Body, UnauthorizedException, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Autenticação')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiOperation({ summary: 'Login de usuários e administradores' })
  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) {
      throw new UnauthorizedException('E-mail ou senha incorretos.');
    }
    return this.authService.login(user);
  }

  @ApiOperation({ summary: 'Registro de nova empresa (Tenant)' })
  @Post('register')
  async register(
    @Body()
    body: {
      tenantName: string;
      slug: string;
      userName: string;
      email: string;
      password: string;
    },
  ) {
    return this.authService.registerTenant(body);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Obter perfil do usuário conectado' })
  @Get('me')
  getProfile(@Request() req) {
    return req.user;
  }
}
