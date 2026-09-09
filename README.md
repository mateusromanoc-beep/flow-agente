# ⚡ Flow Agente — Plataforma SaaS Multi-tenant de Atendimento via WhatsApp com IA

O **Flow Agente** é uma solução completa, *white-label* e pronta para revenda, desenvolvida para que você possa comercializar automações inteligentes de WhatsApp para múltiplas empresas (clientes/tenants).

Cada cliente possui seus dados totalmente isolados, seus próprios números de WhatsApp, equipe de atendentes, prompts de Inteligência Artificial personalizados e chaves de integração para CRMs, ERPs e fluxos do **n8n/Make**.

---

## 🌟 Principais Recursos

- 🏢 **Arquitetura Multi-tenant & White-Label:**
  - Isolamento estrito de dados por `tenant_id`.
  - Painel Super-Admin para você criar, ativar/bloquear empresas e gerenciar planos.
- 📱 **Conexão WhatsApp (Evolution API):**
  - Conexão em tempo real via QR Code gerado na tela com 1 clique.
- 🤖 **Cérebro de IA com Google Gemini:**
  - Prompt personalizável para cada empresa (persona acolhedora, tom, serviços).
  - **Pausa Inteligente Anti-conflito:** Quando um atendente humano digita ou o cliente pede suporte humano, a IA é pausada automaticamente (ex: por 5 horas).
  - **Divisão Natural de Mensagens:** Suporte ao delimitador `\\` para enviar respostas picadas com delay natural.
- 💬 **Caixa de Entrada Unificada (Inbox):**
  - Chat em tempo real via WebSockets (Socket.io).
  - Notas internas de equipe, tags coloridas e alternador de IA ativo/pausado.
- 🔗 **Hub de Integração Externa (CRMs, n8n, Make, Kiwify, Hotmart):**
  - **API Pública com Chaves de API (`x-api-key`)** para disparo de mensagens externas.
  - **Webhooks de Saída** que avisam seus sistemas quando novas mensagens chegam.
  - Documentação interativa Swagger/OpenAPI em `/api/docs`.
- 💳 **Monetização & Cobrança (Stripe):**
  - Planos Starter, Pro e Enterprise com checkout transparente e webhook de liberação automática.

---

## 🛠️ Tecnologias Utilizadas

- **Backend:** Node.js (NestJS + TypeScript)
- **Banco de Dados:** PostgreSQL + Prisma ORM
- **Mensageria & Filas:** Redis + BullMQ
- **WhatsApp:** Evolution API (Baileys)
- **IA:** Google Gemini (SDK Oficial)
- **Frontend:** React + Vite + Tailwind CSS + Lucide Icons + Socket.io
- **Containers:** Docker + Docker Compose

---

## 🚀 Como Rodar o Projeto

### Opção 1: Rodando com Docker Compose (Recomendado)

1. Clone ou navegue até a pasta do projeto:
   ```bash
   cd flow-agente
   ```

2. Copie o arquivo de variáveis de ambiente:
   ```bash
   cp .env.example .env
   ```

3. Suba todos os serviços com um único comando:
   ```bash
   docker-compose up -d --build
   ```

4. Acesse no seu navegador:
   - **Painel Web (Frontend):** [http://localhost](http://localhost) ou [http://localhost:5173](http://localhost:5173)
   - **Backend API:** [http://localhost:3000](http://localhost:3000)
   - **Documentação Swagger:** [http://localhost:3000/api/docs](http://localhost:3000/api/docs)

---

### Opção 2: Rodando em Modo de Desenvolvimento Local

#### 1. Backend (NestJS)
```bash
cd apps/backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed    # Cria os planos e o usuário Super Admin
npm run start:dev
```

#### 2. Frontend (React)
```bash
cd apps/frontend
npm install
npm run dev
```

---

## 🔑 Credenciais Padrão de Demonstração (Seed)

| Perfil | E-mail | Senha | O que você pode fazer |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@flowagente.com` | `admin123` | Gerenciar todos os clientes, planos, limites e métricas da plataforma. |
| **Cliente Demo (Gislaine)** | `gislaine@azzem.com.br` | `admin123` | Ver o Inbox com conversas, conectar WhatsApp, configurar a IA Alma e gerar API Keys. |

---

## 💡 Como Revender e Cadastrar um Novo Cliente

1. Faça login como **Super Admin** (`admin@flowagente.com`).
2. Acesse a aba **Super Admin** no menu lateral.
3. Clique em **"Cadastrar Novo Cliente"**.
4. Preencha o nome da empresa (ex: *Clínica Silva*), slug (ex: *clinica-silva*), nome do dono e senha.
5. O cliente receberá o acesso dele e poderá conectar seu próprio número de WhatsApp e configurar sua IA sem ver os dados de outras empresas.

---

## 🔌 Como Integrar com n8n, Make ou CRMs Externos

Qualquer cliente pode gerar uma Chave de API na aba **API & Webhooks** e disparar mensagens com um nó HTTP no n8n:

### Exemplo de Envio de Mensagem (HTTP POST):
```bash
curl -X POST http://localhost:3000/v1/messages/send \
  -H "Content-Type: application/json" \
  -H "x-api-key: fa_sua_chave_aqui" \
  -d '{
    "number": "5511999998888",
    "text": "Olá! Seu pedido foi confirmado com sucesso."
  }'
```

### Script de Teste Automatizado
Para simular um envio de CRM via terminal:
```bash
node scripts/simulate-crm-integration.js
```
