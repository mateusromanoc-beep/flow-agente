import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ShieldCheck, Building2, Plus, Users, MessageSquare, CheckCircle, XCircle } from 'lucide-react';

export const SuperAdmin: React.FC = () => {
  const [tenants, setTenants] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>({});
  const [showModal, setShowModal] = useState(false);
  const [newTenant, setNewTenant] = useState({
    tenantName: '',
    slug: '',
    userName: '',
    email: '',
    password: '',
  });

  const loadData = async () => {
    try {
      const [resTenants, resMetrics] = await Promise.all([
        api.get('/tenants'),
        api.get('/tenants/metrics'),
      ]);
      setTenants(resTenants.data);
      setMetrics(resMetrics.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', newTenant);
      setShowModal(false);
      setNewTenant({
        tenantName: '',
        slug: '',
        userName: '',
        email: '',
        password: '',
      });
      loadData();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Erro ao criar cliente.');
    }
  };

  const toggleTenantStatus = async (tenant: any) => {
    try {
      await api.put(`/tenants/${tenant.id}`, { isActive: !tenant.isActive });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto overflow-y-auto h-full space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-amber-400" />
            Painel Super-Admin (Dono da Plataforma)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Gerencie todas as empresas clientes (Tenants), usuários, limites e faturamento SaaS.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4" />
          Cadastrar Novo Cliente
        </button>
      </div>

      {/* Métricas Globais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <p className="text-xs font-semibold text-slate-400 uppercase">Empresas Clientes</p>
          <h3 className="text-2xl font-bold text-white mt-1">{metrics.totalTenants || 0}</h3>
          <span className="text-[11px] text-emerald-400 font-medium">
            {metrics.activeTenants || 0} ativas
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <p className="text-xs font-semibold text-slate-400 uppercase">Total Atendentes</p>
          <h3 className="text-2xl font-bold text-white mt-1">{metrics.totalUsers || 0}</h3>
          <span className="text-[11px] text-slate-500 font-medium">Operadores cadastrados</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <p className="text-xs font-semibold text-slate-400 uppercase">Total Atendimentos</p>
          <h3 className="text-2xl font-bold text-white mt-1">{metrics.totalConversations || 0}</h3>
          <span className="text-[11px] text-teal-400 font-medium">Conversas no banco</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <p className="text-xs font-semibold text-slate-400 uppercase">Mensagens Processadas</p>
          <h3 className="text-2xl font-bold text-white mt-1">{metrics.totalMessages || 0}</h3>
          <span className="text-[11px] text-purple-400 font-medium">Disparos &amp; IA</span>
        </div>
      </div>

      {/* Tabela de Tenants */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h2 className="font-bold text-sm text-slate-100">Empresas Clientes Cadastradas</h2>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
            <tr>
              <th className="px-6 py-4">Empresa / Subdomínio</th>
              <th className="px-6 py-4">Plano</th>
              <th className="px-6 py-4">Conexões WhatsApp</th>
              <th className="px-6 py-4">Atendentes</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-300">
            {tenants.map((t) => (
              <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-slate-300">
                      <Building2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-100">{t.name}</p>
                      <p className="text-slate-500 font-mono text-[10px]">slug: {t.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 font-semibold text-[10px] border border-emerald-800/50">
                    {t.plan?.name || 'Pro'}
                  </span>
                </td>
                <td className="px-6 py-4">{t._count?.whatsappConnections || 0} números</td>
                <td className="px-6 py-4">{t._count?.users || 0} atendentes</td>
                <td className="px-6 py-4">
                  {t.isActive ? (
                    <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                      <CheckCircle className="w-3.5 h-3.5" /> Ativo
                    </span>
                  ) : (
                    <span className="text-rose-400 flex items-center gap-1 font-semibold">
                      <XCircle className="w-3.5 h-3.5" /> Bloqueado
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => toggleTenantStatus(t)}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium"
                  >
                    {t.isActive ? 'Bloquear' : 'Desbloquear'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Criar Tenant */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="font-bold text-base text-slate-100 mb-4">Cadastrar Novo Cliente (Tenant)</h3>
            <form onSubmit={handleCreateTenant} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Nome da Empresa</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Clínica Sorriso Novo"
                  value={newTenant.tenantName}
                  onChange={(e) => setNewTenant({ ...newTenant, tenantName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Identificador / Slug</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: clinica-sorriso"
                  value={newTenant.slug}
                  onChange={(e) => setNewTenant({ ...newTenant, slug: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Nome do Administrador</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Dr. Roberto Santos"
                  value={newTenant.userName}
                  onChange={(e) => setNewTenant({ ...newTenant, userName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">E-mail de Login</label>
                <input
                  type="email"
                  required
                  placeholder="roberto@clinica.com"
                  value={newTenant.email}
                  onChange={(e) => setNewTenant({ ...newTenant, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Senha Provisória</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newTenant.password}
                  onChange={(e) => setNewTenant({ ...newTenant, password: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/20"
                >
                  Criar Empresa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
