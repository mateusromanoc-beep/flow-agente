import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { CreditCard, Check, Sparkles, Shield, Zap } from 'lucide-react';

export const Billing: React.FC = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [resPlans, resSub] = await Promise.all([
          api.get('/billing/plans'),
          api.get('/billing/subscription'),
        ]);
        setPlans(resPlans.data);
        setSubscription(resSub.data);
      } catch (err) {
        console.error(err);
      }
    };
    loadData();
  }, []);

  const handleSubscribe = async (planId: string) => {
    setLoading(true);
    try {
      const res = await api.post('/billing/checkout', { planId });
      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto overflow-y-auto h-full space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <CreditCard className="w-7 h-7 text-emerald-400" />
          Planos &amp; Assinatura
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Gerenciamento de faturamento da sua empresa via Stripe com ativação instantânea.
        </p>
      </div>

      {/* Grid de Planos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrent = subscription?.planId === plan.id;

          return (
            <div
              key={plan.id}
              className={`bg-slate-900 border rounded-3xl p-8 flex flex-col justify-between shadow-2xl relative ${
                isCurrent
                  ? 'border-emerald-500 ring-1 ring-emerald-500/50 bg-slate-900/90'
                  : 'border-slate-800'
              }`}
            >
              {isCurrent && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-emerald-500 text-slate-950 font-bold text-[11px] tracking-wide uppercase shadow-lg shadow-emerald-500/30">
                  Plano Atual
                </span>
              )}

              <div>
                <h3 className="font-bold text-xl text-slate-100">{plan.name}</h3>
                <p className="text-xs text-slate-400 mt-1 mb-6">{plan.description}</p>

                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-sm font-semibold text-slate-400">R$</span>
                  <span className="text-4xl font-extrabold text-white">{plan.priceMonthly}</span>
                  <span className="text-xs text-slate-400 font-medium">/mês</span>
                </div>

                <ul className="space-y-3 text-xs text-slate-300">
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>{plan.maxWhatsapp}</strong> número(s) de WhatsApp conectado(s)</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>{plan.maxAgents}</strong> atendentes simultâneos</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Até <strong>{plan.maxMessagesMonth.toLocaleString()}</strong> mensagens/mês</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Agente de IA Gemini com pausa humana</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>API Pública &amp; Webhooks para CRMs</span>
                  </li>
                </ul>
              </div>

              <div className="pt-8">
                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={isCurrent || loading}
                  className={`w-full py-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                    isCurrent
                      ? 'bg-slate-800 text-slate-400 cursor-default'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20'
                  }`}
                >
                  {isCurrent ? 'Plano Ativo' : 'Assinar Plano'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
