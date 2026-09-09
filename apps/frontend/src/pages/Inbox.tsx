import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  Send,
  Bot,
  UserCheck,
  PauseCircle,
  PlayCircle,
  Tag as TagIcon,
  FileText,
  Clock,
  Sparkles,
  Phone,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { io, Socket } from 'socket.io-client';

export const Inbox: React.FC = () => {
  const { tenant } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'notes'>('chat');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  // Load conversations
  const loadConversations = async () => {
    try {
      const res = await api.get('/chat/conversations');
      setConversations(res.data);
      if (res.data.length > 0 && !selectedConv) {
        setSelectedConv(res.data[0]);
      }
    } catch (err) {
      console.error('Erro ao carregar conversas:', err);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  // WebSockets setup
  useEffect(() => {
    if (tenant?.id) {
      const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
        query: { tenantId: tenant.id },
      });
      socketRef.current = socket;

      socket.on('new_message', (data: { conversationId: string; message: any }) => {
        if (selectedConv?.id === data.conversationId) {
          setMessages((prev) => [...prev, data.message]);
        }
        loadConversations();
      });

      socket.on('conversation_updated', (updated: any) => {
        setConversations((prev) =>
          prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c))
        );
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [tenant?.id, selectedConv?.id]);

  // Load messages for selected conversation
  useEffect(() => {
    if (selectedConv?.id) {
      const fetchMessages = async () => {
        setLoading(true);
        try {
          const res = await api.get(`/chat/conversations/${selectedConv.id}/messages`);
          setMessages(res.data.messages);
          setNotes(res.data.notes);
          if (socketRef.current) {
            socketRef.current.emit('join_conversation', { conversationId: selectedConv.id });
          }
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchMessages();
    }
  }, [selectedConv?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !selectedConv) return;

    const content = inputMessage;
    setInputMessage('');

    try {
      const res = await api.post(`/chat/conversations/${selectedConv.id}/messages`, { content });
      setMessages((prev) => [...prev, res.data]);
      loadConversations();
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim() || !selectedConv) return;

    try {
      const res = await api.post(`/chat/conversations/${selectedConv.id}/notes`, {
        content: noteContent,
      });
      setNotes((prev) => [...prev, res.data]);
      setNoteContent('');
    } catch (err) {
      console.error(err);
    }
  };

  const toggleAi = async () => {
    if (!selectedConv) return;
    try {
      if (selectedConv.status === 'HUMAN_ATTENDING' || selectedConv.aiPausedUntil) {
        await api.post(`/agent-config/resume/${selectedConv.id}`);
        setSelectedConv((prev: any) => ({
          ...prev,
          status: 'OPEN',
          aiPausedUntil: null,
          isAiHandling: true,
        }));
      } else {
        await api.post(`/agent-config/pause/${selectedConv.id}`, { minutes: 300 });
        setSelectedConv((prev: any) => ({
          ...prev,
          status: 'HUMAN_ATTENDING',
          isAiHandling: false,
          aiPausedUntil: new Date(Date.now() + 300 * 60000).toISOString(),
        }));
      }
      loadConversations();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredConversations = conversations.filter((c) =>
    (c.contact?.name || c.contact?.phoneNumber || '')
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-full w-full bg-slate-950 overflow-hidden">
      {/* 1. Lista de Conversas (Esquerda) */}
      <div className="w-80 border-r border-slate-800 flex flex-col bg-slate-950 shrink-0">
        <div className="p-4 border-b border-slate-800">
          <h2 className="text-base font-bold text-white mb-3">Atendimentos</h2>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar contato ou número..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-900">
          {filteredConversations.map((conv) => {
            const isSelected = selectedConv?.id === conv.id;
            const isAiActive = conv.isAiHandling && !conv.aiPausedUntil;
            return (
              <button
                key={conv.id}
                onClick={() => setSelectedConv(conv)}
                className={`w-full p-3.5 text-left flex items-start gap-3 transition-colors ${
                  isSelected ? 'bg-slate-900/90 border-l-2 border-emerald-500' : 'hover:bg-slate-900/40'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-800 to-slate-700 flex items-center justify-center font-bold text-slate-300 text-sm shrink-0">
                  {conv.contact?.name?.[0] || 'C'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-200 text-xs truncate">
                      {conv.contact?.name || conv.contact?.phoneNumber}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {conv.lastMessageAt ? format(new Date(conv.lastMessageAt), 'HH:mm') : ''}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 truncate mb-1.5">
                    {conv.messages?.[0]?.content || 'Nenhuma mensagem recente'}
                  </p>

                  <div className="flex items-center gap-1.5">
                    {isAiActive ? (
                      <span className="text-[10px] font-medium text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <Bot className="w-3 h-3" />
                        IA Respondendo
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-amber-400 bg-amber-950/80 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <UserCheck className="w-3 h-3" />
                        Humano
                      </span>
                    )}

                    {conv.contact?.contactTags?.map((ct: any) => (
                      <span
                        key={ct.tag.id}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300"
                        style={{ color: ct.tag.color }}
                      >
                        {ct.tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Área Central (Chat / Mensagens) */}
      <div className="flex-1 flex flex-col bg-slate-900/50">
        {selectedConv ? (
          <>
            {/* Top Bar da Conversa */}
            <div className="h-16 px-6 border-b border-slate-800 bg-slate-950 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  {selectedConv.contact?.name?.[0] || 'C'}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                    {selectedConv.contact?.name || 'Cliente WhatsApp'}
                    <span className="text-xs font-normal text-slate-400">
                      ({selectedConv.contact?.phoneNumber})
                    </span>
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <Phone className="w-3 h-3 text-emerald-400" />
                    <span>WhatsApp Evolution API</span>
                  </div>
                </div>
              </div>

              {/* Controles da IA & Modos */}
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleAi}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 border transition-all ${
                    selectedConv.status === 'HUMAN_ATTENDING' || selectedConv.aiPausedUntil
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                  }`}
                >
                  {selectedConv.status === 'HUMAN_ATTENDING' || selectedConv.aiPausedUntil ? (
                    <>
                      <PlayCircle className="w-3.5 h-3.5" />
                      Retomar IA
                    </>
                  ) : (
                    <>
                      <PauseCircle className="w-3.5 h-3.5" />
                      Pausar IA (Atender Humano)
                    </>
                  )}
                </button>

                <div className="flex rounded-lg bg-slate-900 p-1 border border-slate-800">
                  <button
                    onClick={() => setActiveTab('chat')}
                    className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                      activeTab === 'chat' ? 'bg-slate-800 text-white' : 'text-slate-400'
                    }`}
                  >
                    Chat
                  </button>
                  <button
                    onClick={() => setActiveTab('notes')}
                    className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                      activeTab === 'notes' ? 'bg-slate-800 text-white' : 'text-slate-400'
                    }`}
                  >
                    Notas ({notes.length})
                  </button>
                </div>
              </div>
            </div>

            {/* Mensagens do Chat */}
            {activeTab === 'chat' ? (
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {messages.map((msg) => {
                  const isOut = msg.isFromMe;
                  const isAi = msg.senderType === 'AI';

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isOut ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-lg rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                          isOut
                            ? isAi
                              ? 'bg-teal-900/70 border border-teal-700/50 text-teal-100 rounded-br-none'
                              : 'bg-emerald-600 text-white rounded-br-none'
                            : 'bg-slate-800 text-slate-100 border border-slate-700/60 rounded-bl-none'
                        }`}
                      >
                        {isAi && (
                          <div className="flex items-center gap-1 text-[10px] font-bold text-teal-300 mb-1">
                            <Sparkles className="w-3 h-3" />
                            Alma (IA Gemini)
                          </div>
                        )}
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                        <div
                          className={`text-[10px] mt-1 text-right ${
                            isOut ? 'text-emerald-200/70' : 'text-slate-400'
                          }`}
                        >
                          {msg.createdAt
                            ? format(new Date(msg.createdAt), 'HH:mm', { locale: ptBR })
                            : ''}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            ) : (
              /* Notas Internas */
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                <form onSubmit={handleAddNote} className="mb-6">
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Adicionar Nota Interna (visível apenas para sua equipe):
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      placeholder="Ex: Cliente prefere atendimento às 14h nas terças-feiras..."
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold"
                    >
                      Salvar Nota
                    </button>
                  </div>
                </form>

                <div className="space-y-3">
                  {notes.map((note) => (
                    <div key={note.id} className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                        <span className="font-semibold text-slate-200">
                          {note.user?.name || 'Atendente'}
                        </span>
                        <span>{format(new Date(note.createdAt), "dd/MM 'às' HH:mm")}</span>
                      </div>
                      <p className="text-xs text-slate-300">{note.content}</p>
                    </div>
                  ))}
                  {notes.length === 0 && (
                    <p className="text-center text-xs text-slate-500 py-8">
                      Nenhuma nota interna registrada para esta conversa.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Input Bar */}
            <div className="p-4 bg-slate-950 border-t border-slate-800">
              <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Digite uma mensagem como atendente humano..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  className="w-11 h-11 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20 transition-all font-bold"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <Bot className="w-16 h-16 text-slate-700 mb-4 animate-bounce" />
            <h3 className="text-lg font-bold text-slate-300">Nenhuma conversa selecionada</h3>
            <p className="text-sm text-slate-500 max-w-sm mt-1">
              Selecione um contato na barra lateral para acompanhar o diálogo da IA ou assumir o atendimento.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
