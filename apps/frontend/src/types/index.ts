export type Role = 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'AGENT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  tenantId?: string;
  tenant?: Tenant;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  primaryColor?: string;
  isActive: boolean;
  subscriptionStatus: string;
  plan?: Plan;
}

export interface Plan {
  id: string;
  name: string;
  priceMonthly: number;
  maxWhatsapp: number;
  maxAgents: number;
  maxMessagesMonth: number;
  allowAiAgent: boolean;
  allowApiAccess: boolean;
}

export interface WhatsappConnection {
  id: string;
  tenantId: string;
  name: string;
  instanceName: string;
  status: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'QRCODE';
  phoneNumber?: string;
  qrCode?: string;
  createdAt: string;
}

export interface Contact {
  id: string;
  name?: string;
  phoneNumber: string;
  email?: string;
  contactTags?: { tag: Tag }[];
  _count?: { conversations: number };
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Conversation {
  id: string;
  tenantId: string;
  contactId: string;
  contact: Contact;
  whatsappConnectionId: string;
  assignedUserId?: string;
  assignedUser?: { id: string; name: string };
  status: 'OPEN' | 'PENDING_HUMAN' | 'HUMAN_ATTENDING' | 'RESOLVED' | 'CLOSED';
  unreadCount: number;
  lastMessageAt: string;
  aiPausedUntil?: string;
  isAiHandling: boolean;
  messages?: Message[];
}

export interface Message {
  id: string;
  conversationId: string;
  senderType: 'CONTACT' | 'AI' | 'AGENT' | 'SYSTEM' | 'API';
  senderUser?: { id: string; name: string };
  type: 'TEXT' | 'IMAGE' | 'AUDIO' | 'DOCUMENT';
  content: string;
  isFromMe: boolean;
  createdAt: string;
}

export interface AgentConfig {
  id: string;
  name: string;
  promptSystem: string;
  modelName: string;
  temperature: number;
  isActive: boolean;
  humanPauseMinutes: number;
  splitDelimiter: string;
  messageDelaySeconds: number;
  triggerHandoffKeywords: string;
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsedAt?: string;
}

export interface WebhookSubscription {
  id: string;
  url: string;
  events: string[];
  createdAt: string;
}
