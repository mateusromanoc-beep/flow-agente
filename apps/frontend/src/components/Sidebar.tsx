import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  MessageSquare,
  QrCode,
  Bot,
  Users,
  KeyRound,
  CreditCard,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user, tenant } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const navItems = [
    { to: '/inbox', label: 'Conversas', icon: MessageSquare, show: true },
    { to: '/connections', label: 'WhatsApp', icon: QrCode, show: true },
    { to: '/agent', label: 'Agente de IA', icon: Bot, show: true },
    { to: '/contacts', label: 'Contatos & CRM', icon: Users, show: true },
    { to: '/integrations', label: 'API & Webhooks', icon: KeyRound, show: true },
    { to: '/billing', label: 'Planos & Cobrança', icon: CreditCard, show: true },
    { to: '/super-admin', label: 'Super Admin', icon: ShieldCheck, show: isSuperAdmin },
  ];

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between shrink-0">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
              Flow Agente
            </h1>
            <span className="text-[11px] font-medium text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
              {tenant?.name || 'White-Label SaaS'}
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5">
          {navItems
            .filter((item) => item.show)
            .map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
        </nav>
      </div>

      {/* Plan and Status Footer */}
      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-900/80 rounded-lg p-3 border border-slate-800 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Plano Atual</span>
            <span className="text-[11px] font-bold text-emerald-400 uppercase">
              {tenant?.plan?.name || 'Pro Ativo'}
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
            <div className="bg-emerald-500 h-1.5 rounded-full w-2/5"></div>
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">Evolution API Conectada</p>
        </div>
      </div>
    </aside>
  );
};
