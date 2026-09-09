import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKeyHeader = request.headers['x-api-key'] || request.query.apiKey;

    if (!apiKeyHeader) {
      throw new UnauthorizedException('Chave de API (x-api-key) não fornecida.');
    }

    const keyRecord = await this.prisma.apiKey.findUnique({
      where: { key: String(apiKeyHeader) },
      include: { tenant: true },
    });

    if (!keyRecord || !keyRecord.isActive || !keyRecord.tenant.isActive) {
      throw new UnauthorizedException('Chave de API inválida ou inativa.');
    }

    // Update last used timestamp
    await this.prisma.apiKey.update({
      where: { id: keyRecord.id },
      data: { lastUsedAt: new Date() },
    });

    request.tenant = keyRecord.tenant;
    request.apiKey = keyRecord;
    return true;
  }
}
