import { PrismaClient, Role, PlanType, SubscriptionStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Populando banco de dados inicial do Flow Agente...');

  // 1. Cria Planos Padrão
  const starterPlan = await prisma.plan.upsert({
    where: { id: 'plan-starter' },
    update: {},
    create: {
      id: 'plan-starter',
      name: 'Starter',
      type: PlanType.STARTER,
      description: 'Ideal para profissionais autônomos e pequenos negócios',
      priceMonthly: 147.0,
      maxWhatsapp: 1,
      maxAgents: 2,
      maxMessagesMonth: 3000,
      allowAiAgent: true,
      allowApiAccess: true,
    },
  });

  const proPlan = await prisma.plan.upsert({
    where: { id: 'plan-pro' },
    update: {},
    create: {
      id: 'plan-pro',
      name: 'Pro',
      type: PlanType.PRO,
      description: 'Perfeito para clínicas, e-commerces e empresas em crescimento',
      priceMonthly: 297.0,
      maxWhatsapp: 3,
      maxAgents: 5,
      maxMessagesMonth: 15000,
      allowAiAgent: true,
      allowApiAccess: true,
    },
  });

  const enterprisePlan = await prisma.plan.upsert({
    where: { id: 'plan-enterprise' },
    update: {},
    create: {
      id: 'plan-enterprise',
      name: 'Enterprise',
      type: PlanType.ENTERPRISE,
      description: 'Solução ilimitada para operações de grande escala',
      priceMonthly: 597.0,
      maxWhatsapp: 10,
      maxAgents: 20,
      maxMessagesMonth: 50000,
      allowAiAgent: true,
      allowApiAccess: true,
    },
  });

  // 2. Cria Super Admin da Plataforma
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@flowagente.com' },
    update: {},
    create: {
      email: 'admin@flowagente.com',
      password: hashedPassword,
      name: 'Super Administrador Flow Agente',
      role: Role.SUPER_ADMIN,
    },
  });

  // 3. Cria Empresa Demonstração (Tenant: Gislaine Azzem)
  const demoTenant = await prisma.tenant.upsert({
    where: { slug: 'gislaine-terapia' },
    update: {},
    create: {
      name: 'Espaço Terapêutico Gislaine Azzem',
      slug: 'gislaine-terapia',
      planId: proPlan.id,
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      users: {
        create: [
          {
            name: 'Gislaine Azzem (Admin)',
            email: 'gislaine@azzem.com.br',
            password: hashedPassword,
            role: Role.TENANT_ADMIN,
          },
          {
            name: 'Atendente Beatriz',
            email: 'beatriz@azzem.com.br',
            password: hashedPassword,
            role: Role.AGENT,
          },
        ],
      },
      agentConfigs: {
        create: {
          name: 'Alma - Assistente Virtual',
          promptSystem: `Você é a Alma, assistente virtual da terapeuta Gislaine Azzem. Sua missão é acolher quem chega, tirar dúvidas e qualificar contatos para agendamento online. Seja acolhedora, empática e use \\\\ para quebrar frases longas em blocos naturais.`,
          modelName: 'gemini-1.5-flash',
          humanPauseMinutes: 300,
          splitDelimiter: '\\\\',
          messageDelaySeconds: 1,
        },
      },
      tags: {
        create: [
          { name: 'Novo Lead', color: '#3B82F6' },
          { name: 'Interesse Terapia', color: '#10B981' },
          { name: 'Aguardando Pagamento', color: '#F59E0B' },
          { name: 'Cliente Ativo', color: '#8B5CF6' },
        ],
      },
    },
    include: { users: true },
  });

  // 4. Cria Conexão de WhatsApp e Contato Demo
  const wpConn = await prisma.whatsappConnection.create({
    data: {
      tenantId: demoTenant.id,
      name: 'WhatsApp Principal Clínica',
      instanceName: `instance_gislaine_${Date.now()}`,
      status: 'CONNECTED',
      phoneNumber: '5519999998888',
    },
  });

  const contactDemo = await prisma.contact.create({
    data: {
      tenantId: demoTenant.id,
      name: 'Mariana Silva',
      phoneNumber: '5511988887777',
      email: 'mariana.silva@exemplo.com',
    },
  });

  const convDemo = await prisma.conversation.create({
    data: {
      tenantId: demoTenant.id,
      contactId: contactDemo.id,
      whatsappConnectionId: wpConn.id,
      status: 'OPEN',
      messages: {
        create: [
          {
            senderType: 'CONTACT',
            isFromMe: false,
            type: 'TEXT',
            content: 'Olá, gostaria de saber como funciona a terapia online?',
          },
          {
            senderType: 'AI',
            isFromMe: true,
            type: 'TEXT',
            content: 'Olá, Mariana! Seja muito bem-vinda ao espaço da Gislaine Azzem.',
          },
          {
            senderType: 'AI',
            isFromMe: true,
            type: 'TEXT',
            content: 'As sessões são 100% online por videoconferência com duração de 50 minutos. Gostaria de conhecer os horários disponíveis?',
          },
        ],
      },
    },
  });

  console.log('✅ Seed executado com sucesso!');
  console.log(`🔑 Super Admin: admin@flowagente.com / senha: admin123`);
  console.log(`🏢 Tenant Demo: gislaine@azzem.com.br / senha: admin123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
