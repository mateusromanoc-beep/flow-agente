import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { KeyRound, Webhook, Plus, Copy, Check, Trash2, Code2, ExternalLink, Sparkles } from 'lucide-react';

export const Integrations: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [resKeys, resHooks] = await Promise.all([
        api.get('/api-keys'),
        api.get('/webhooks'),
      ]);
      setApiKeys(resKeys.data);
      setWebhooks(resHooks.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    try {
      await api.post('/api-keys', { name: newKeyName });
      setNewKeyName('');
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteKey = async (id: string) => {
    if (!confirm('Deseja excluir esta chave de API?')) return;
    try {
      await api.delete(`/api-keys/${id}`);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWebhookUrl.trim()) return;
    try {
      await api.post('/webhooks', {
        url: newWebhookUrl,
        events: ['message.received', 'message.sent', 'conversation.status_changed'],
      });
      setNewWebhookUrl('');
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    if (!confirm('Deseja excluir este webhook?')) return;
    try {
      await api.delete(`/webhooks/${id}`);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto overflow-y-auto h-full space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">API &amp; Integrações Externas</h1>
        <p className="text-sm text-slate-400 mt-1">
          Conecte o Flow Agente ao seu CRM, ERP, plataformas de vendas (Kiwify, Hotmart) ou automações no n8n/Make.
        </p>
      </div>

      {/* Seção 1: Chaves de API */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Chaves de API (x-api-key)</h2>
              <p className="text-xs text-slate-400">
                Use esta chave para autenticar requisições de envio de mensagem a partir de sistemas externos.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleCreateKey} className="flex gap-3">
          <input
            type="text"
            required
            placeholder="Nome da Integração (ex: Meu n8n, CRM HubSpot, Loja Shopify...)"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Gerar Chave
          </button>
        </form>

        <div className="divide-y divide-slate-800/80">
          {apiKeys.map((k) => (
            <div key={k.id} className="py-3.5 flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-xs text-slate-200">{k.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <code className="px-2.5 py-1 bg-slate-950 rounded-lg text-emerald-400 font-mono text-[11px] border border-slate-800">
                    {k.key}
                  </code>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyToClipboard(k.key, k.id)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  {copiedKey === k.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copiar
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleDeleteKey(k.id)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-950 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {apiKeys.length === 0 && (
            <p className="text-center text-xs text-slate-500 py-6">
              Nenhuma chave de API gerada.
            </p>
          )}
        </div>
      </div>

      {/* Seção 2: Webhooks de Saída */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center">
            <Webhook className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">Webhooks de Saída</h2>
            <p className="text-xs text-slate-400">
              Notifique automaticamente seus servidores quando novas mensagens chegarem ou conversas forem encerradas.
            </p>
          </div>
        </div>

        <form onSubmit={handleCreateWebhook} className="flex gap-3">
          <input
            type="url"
            required
            placeholder="https://seu-sistema.com/api/webhook ou URL do n8n"
            value={newWebhookUrl}
            onChange={(e) => setNewWebhookUrl(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            className="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Cadastrar Webhook
          </button>
        </form>

        <div className="divide-y divide-slate-800/80">
          {webhooks.map((w) => (
            <div key={w.id} className="py-3.5 flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="font-mono text-xs text-slate-200 truncate">{w.url}</p>
                <div className="flex gap-1.5 mt-1">
                  {w.events?.map((ev: string) => (
                    <span key={ev} className="text-[10px] px-2 py-0.5 rounded bg-slate-950 text-teal-400 border border-slate-800 font-mono">
                      {ev}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={() => handleDeleteWebhook(w.id)}
                className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-950 rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {webhooks.length === 0 && (
            <p className="text-center text-xs text-slate-500 py-6">
              Nenhum webhook cadastrado.
            </p>
          )}
        </div>
      </div>

      {/* Seção 3: Exemplo Prático de Integração */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
          <Code2 className="w-4 h-4 text-emerald-400" />
          Como disparar mensagens via n8n / cURL / CRM
        </h3>
        <p className="text-xs text-slate-400">
          Envie uma requisição HTTP POST para o endpoint público abaixo passando o cabeçalho <code className="text-emerald-400">x-api-key</code>:
        </p>

        <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 font-mono text-[11px] text-slate-300 leading-relaxed overflow-x-auto">
          <p className="text-slate-500 mb-2"># Exemplo em cURL / n8n HTTP Request Node</p>
          <p className="text-emerald-400">curl -X POST http://localhost:3000/v1/messages/send \</p>
          <p className="pl-4 text-slate-300">-H "Content-Type: application/json" \</p>
          <p className="pl-4 text-teal-300">-H "x-api-key: fa_sua_chave_aqui" \</p>
          <p className="pl-4 text-slate-300">-d '&#123;</p>
          <p className="pl-8 text-amber-300">"number": "5511999998888",</p>
          <p className="pl-8 text-amber-300">"text": "Olá! Seu agendamento foi confirmado com sucesso!"</p>
          <p className="pl-4 text-slate-300">&#125;'</p>
        </div>
      </div>
    </div>
  );
};
