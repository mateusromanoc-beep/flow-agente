import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.tenant.findMany({
      include: {
        plan: true,
        _count: {
          select: {
            users: true,
            whatsappConnections: true,
            conversations: true,
            contacts: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        plan: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            createdAt: true,
          },
        },
        whatsappConnections: true,
        agentConfigs: true,
        apiKeys: true,
        webhookSubscriptions: true,
      },
    });
    if (!tenant) {
      throw new NotFoundException('Empresa (Tenant) não encontrada.');
    }
    return tenant;
  }

  async update(id: string, data: any) {
    return this.prisma.tenant.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.prisma.tenant.delete({
      where: { id },
    });
  }

  async getMetrics() {
    const totalTenants = await this.prisma.tenant.count();
    const activeTenants = await this.prisma.tenant.count({ where: { isActive: true } });
    const totalUsers = await this.prisma.user.count();
    const totalConversations = await this.prisma.conversation.count();
    const totalMessages = await this.prisma.message.count();

    return {
      totalTenants,
      activeTenants,
      totalUsers,
      totalConversations,
      totalMessages,
    };
  }
}
