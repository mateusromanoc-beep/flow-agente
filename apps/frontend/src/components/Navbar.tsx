import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User as UserIcon, Sparkles } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, tenant } = useAuth();

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/60 backdrop-blur px-6 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          Agente Inteligente Ativo
        </span>
        <span className="text-xs text-slate-400">
          Empresa: <strong className="text-slate-200">{tenant?.name || 'Minha Operação'}</strong>
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-semibold border border-slate-700">
            <UserIcon className="w-4 h-4" />
          </div>
          <div className="flex flex-col text-left">
            <span className="font-medium text-slate-200 text-xs">{user?.name}</span>
            <span className="text-[10px] text-slate-400 uppercase">{user?.role}</span>
          </div>
        </div>

        <button
          onClick={logout}
          title="Sair"
          className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
