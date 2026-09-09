import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { QrCode, Plus, RefreshCw, CheckCircle2, AlertCircle, Trash2, Smartphone } from 'lucide-react';

export const Connections: React.FC = () => {
  const [connections, setConnections] = useState<any[]>([]);
  const [newConnName, setNewConnName] = useState('');
  const [selectedQr, setSelectedQr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadConnections = async () => {
    try {
      const res = await api.get('/whatsapp/connections');
      setConnections(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadConnections();
  }, []);

  const handleCreateConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConnName.trim()) return;

    setLoading(true);
    try {
      const res = await api.post('/whatsapp/connections', { name: newConnName });
      setNewConnName('');
      loadConnections();
      if (res.data.qrCode) {
        setSelectedQr(res.data.qrCode);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshQr = async (instanceName: string) => {
    try {
      const res = await api.get(`/whatsapp/connections/${instanceName}/qrcode`);
      if (res.data.qrcode) {
        setSelectedQr(res.data.qrcode);
      }
      loadConnections();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente desconectar e excluir este número?')) return;
    try {
      await api.delete(`/whatsapp/connections/${id}`);
      loadConnections();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto overflow-y-auto h-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Conexões de WhatsApp</h1>
          <p className="text-sm text-slate-400 mt-1">
            Conecte seus números via QR Code (Evolution API) para que a IA e os atendentes possam receber e enviar mensagens.
          </p>
        </div>
      </div>

      {/* Form Criar Conexão */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8 shadow-xl">
        <h2 className="text-base font-bold text-slate-200 mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-emerald-400" />
          Conectar Novo Número de WhatsApp
        </h2>
        <form onSubmit={handleCreateConnection} className="flex gap-4">
          <input
            type="text"
            required
            placeholder="Nome do Número (ex: Suporte Principal, Vendas Clínica...)"
            value={newConnName}
            onChange={(e) => setNewConnName(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
          >
            {loading ? 'Gerando QR Code...' : 'Gerar QR Code'}
          </button>
        </form>
      </div>

      {/* Lista de Conexões */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {connections.map((conn) => {
          const isConnected = conn.status === 'CONNECTED';
          return (
            <div
              key={conn.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-emerald-400">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-100">{conn.name}</h3>
                      <p className="text-xs text-slate-500">{conn.instanceName}</p>
                    </div>
                  </div>

                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                      isConnected
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {isConnected ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Conectado
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3.5 h-3.5" />
                        Aguardando Leitura
                      </>
                    )}
                  </span>
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 mb-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Provedor:</span>
                    <span className="text-slate-300 font-medium">Evolution API (Baileys)</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Telefone:</span>
                    <span className="text-slate-300 font-medium">
                      {conn.phoneNumber || 'Lendo após pareamento...'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-800/60">
                {!isConnected && (
                  <button
                    onClick={() => handleRefreshQr(conn.instanceName)}
                    className="flex-1 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <QrCode className="w-4 h-4" />
                    Ler QR Code
                  </button>
                )}
                <button
                  onClick={() => handleDelete(conn.id)}
                  className="p-2 rounded-lg bg-slate-950 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-800 text-xs transition-colors"
                  title="Excluir Conexão"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}

        {connections.length === 0 && (
          <div className="col-span-2 text-center py-12 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl">
            <QrCode className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400 font-medium">Nenhum número de WhatsApp conectado ainda.</p>
            <p className="text-xs text-slate-600 mt-1">
              Crie uma conexão acima para ler o QR Code e ativar seu agente inteligente.
            </p>
          </div>
        )}
      </div>

      {/* Modal de QR Code */}
      {selectedQr && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center">
            <h3 className="font-bold text-base text-slate-100 mb-2">Conectar WhatsApp</h3>
            <p className="text-xs text-slate-400 mb-6">
              Abra o WhatsApp no seu celular &gt; Menu ou Configurações &gt; Aparelhos Conectados &gt; Conectar um Aparelho.
            </p>

            <div className="bg-white p-4 rounded-xl inline-block mx-auto mb-6 shadow-inner">
              <img src={selectedQr} alt="QR Code WhatsApp" className="w-56 h-56 object-contain" />
            </div>

            <button
              onClick={() => setSelectedQr(null)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
