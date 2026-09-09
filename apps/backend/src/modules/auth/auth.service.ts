import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { tenant: true },
    });
    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        tenant: user.tenant,
      },
    };
  }

  async registerTenant(data: {
    tenantName: string;
    slug: string;
    userName: string;
    email: string;
    password: string;
  }) {
    const existingUser = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      throw new ConflictException('Já existe um usuário cadastrado com este e-mail.');
    }

    const existingSlug = await this.prisma.tenant.findUnique({ where: { slug: data.slug } });
    if (existingSlug) {
      throw new ConflictException('Este subdomínio/identificador já está em uso.');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const starterPlan = await this.prisma.plan.findFirst({
      where: { type: 'STARTER' },
    });

    const tenant = await this.prisma.tenant.create({
      data: {
        name: data.tenantName,
        slug: data.slug,
        planId: starterPlan?.id,
        users: {
          create: {
            name: data.userName,
            email: data.email,
            password: hashedPassword,
            role: Role.TENANT_ADMIN,
          },
        },
        agentConfigs: {
          create: {
            name: 'Assistente Virtual',
            promptSystem: 'Você é um assistente virtual atencioso e acolhedor. Ajude os clientes a tirar dúvidas sobre os produtos e serviços.',
          },
        },
      },
      include: {
        users: true,
      },
    });

    const adminUser = tenant.users[0];
    return this.login(adminUser);
  }
}
