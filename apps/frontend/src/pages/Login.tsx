import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Zap, Lock, Mail, ArrowRight, ShieldCheck, Building2 } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.accessToken, res.data.user);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'E-mail ou senha inválidos.');
    } finally {
      setLoading(false);
    }
  };

  const setQuickUser = (type: 'superadmin' | 'tenant') => {
    if (type === 'superadmin') {
      setEmail('admin@flowagente.com');
      setPassword('admin123');
    } else {
      setEmail('gislaine@azzem.com.br');
      setPassword('admin123');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Glow effect */}
      <div className="absolute w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -top-20 -left-20 pointer-events-none" />
      <div className="absolute w-96 h-96 bg-teal-500/10 rounded-full blur-3xl -bottom-20 -right-20 pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative z-10">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20 mb-3">
            <Zap className="w-7 h-7 fill-current" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Flow Agente</h1>
          <p className="text-sm text-slate-400 mt-1">Plataforma SaaS de Atendimento e IA para WhatsApp</p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              E-mail
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@empresa.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Senha
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Acessar Painel'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Fast Logins */}
        <div className="mt-8 pt-6 border-t border-slate-800 text-center">
          <p className="text-xs font-medium text-slate-400 mb-3">Acessar Demonstrações Rápidas:</p>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => setQuickUser('superadmin')}
              type="button"
              className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-[11px] font-semibold text-slate-300 flex items-center justify-center gap-1.5 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              Super Admin
            </button>
            <button
              onClick={() => setQuickUser('tenant')}
              type="button"
              className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-[11px] font-semibold text-slate-300 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              Cliente (Gislaine)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
