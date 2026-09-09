import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ContactsService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, search?: string) {
    return this.prisma.contact.findMany({
      where: {
        tenantId,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { phoneNumber: { contains: search } },
                { email: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        contactTags: { include: { tag: true } },
        _count: { select: { conversations: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const contact = await this.prisma.contact.findFirst({
      where: { id, tenantId },
      include: {
        contactTags: { include: { tag: true } },
        conversations: {
          include: {
            messages: { take: 1, orderBy: { createdAt: 'desc' } },
          },
        },
      },
    });
    if (!contact) {
      throw new NotFoundException('Contato não encontrado.');
    }
    return contact;
  }

  async create(tenantId: string, data: { name?: string; phoneNumber: string; email?: string }) {
    const cleanNumber = data.phoneNumber.replace(/\D/g, '');
    return this.prisma.contact.upsert({
      where: {
        tenantId_phoneNumber: {
          tenantId,
          phoneNumber: cleanNumber,
        },
      },
      create: {
        tenantId,
        phoneNumber: cleanNumber,
        name: data.name,
        email: data.email,
      },
      update: {
        name: data.name,
        email: data.email,
      },
    });
  }

  async addTag(contactId: string, tagId: string) {
    return this.prisma.contactTag.upsert({
      where: {
        contactId_tagId: { contactId, tagId },
      },
      create: { contactId, tagId },
      update: {},
    });
  }

  async removeTag(contactId: string, tagId: string) {
    return this.prisma.contactTag.delete({
      where: {
        contactId_tagId: { contactId, tagId },
      },
    });
  }

  async getTags(tenantId: string) {
    return this.prisma.tag.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async createTag(tenantId: string, name: string, color?: string) {
    return this.prisma.tag.create({
      data: {
        tenantId,
        name,
        color: color || '#3B82F6',
      },
    });
  }
}
