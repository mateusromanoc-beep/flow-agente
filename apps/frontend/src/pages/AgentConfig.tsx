import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Bot, Save, Sparkles, Clock, Split, ShieldAlert, Cpu } from 'lucide-react';

export const AgentConfig: React.FC = () => {
  const [config, setConfig] = useState<any>({
    name: 'Alma - Assistente Virtual',
    promptSystem: '',
    modelName: 'gemini-1.5-flash',
    temperature: 0.7,
    isActive: true,
    humanPauseMinutes: 300,
    splitDelimiter: '\\\\',
    messageDelaySeconds: 1,
    triggerHandoffKeywords: 'atendente,humano,falar com alguém,suporte,reclamação',
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await api.get('/agent-config');
        if (res.data) {
          setConfig(res.data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/agent-config', config);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto overflow-y-auto h-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Bot className="w-7 h-7 text-emerald-400" />
            Configuração do Agente de IA
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Personalize a personalidade, regras de acolhimento e inteligência artificial para atender seus clientes no WhatsApp.
          </p>
        </div>

        {saved && (
          <span className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold animate-pulse">
            Configurações salvas com sucesso!
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Ativação Geral */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">Atendimento com IA Ativo</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Permite que o agente responda automaticamente a novos contatos e mensagens recebidas.
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.isActive}
              onChange={(e) => setConfig({ ...config, isActive: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
          </label>
        </div>

        {/* Prompt do Sistema */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider">
              Instruções &amp; Personalidade da Assistente (System Prompt)
            </h3>
            <span className="text-[11px] text-slate-500">
              Dica: use \\ para indicar quebras naturais de mensagem no WhatsApp
            </span>
          </div>

          <textarea
            rows={10}
            value={config.promptSystem}
            onChange={(e) => setConfig({ ...config, promptSystem: e.target.value })}
            placeholder="Você é a Alma, assistente virtual... Defina aqui o tom de voz, os serviços, horários, preços e como acolher os clientes."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 leading-relaxed font-mono"
          />
        </div>

        {/* Parâmetros Avançados e Transbordo Humano */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Modelo e Inteligência */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-400" />
              Modelo de IA &amp; Temperatura
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Modelo Gemini
              </label>
              <select
                value={config.modelName}
                onChange={(e) => setConfig({ ...config, modelName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="gemini-1.5-flash">Google Gemini 1.5 Flash (Super Rápido &amp; Econômico)</option>
                <option value="gemini-1.5-pro">Google Gemini 1.5 Pro (Raciocínio Profundo &amp; Análise)</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-400">Criatividade (Temperatura):</span>
                <span className="font-bold text-emerald-400">{config.temperature}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={config.temperature}
                onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
                className="w-full accent-emerald-500"
              />
            </div>
          </div>

          {/* Intervenção Humana & Pausa */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Pausa Anti-Conflito de Atendente
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Tempo de Pausa da IA quando um Humano digita (minutos):
              </label>
              <input
                type="number"
                value={config.humanPauseMinutes}
                onChange={(e) => setConfig({ ...config, humanPauseMinutes: parseInt(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Padrão: 300 minutos (5 horas) para que o atendente converse em paz com o cliente.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Palavras-chave de Transbordo Humano (separadas por vírgula):
              </label>
              <input
                type="text"
                value={config.triggerHandoffKeywords}
                onChange={(e) => setConfig({ ...config, triggerHandoffKeywords: e.target.value })}
                placeholder="atendente, humano, suporte, financeiro"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Botão Salvar */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </div>
  );
};
