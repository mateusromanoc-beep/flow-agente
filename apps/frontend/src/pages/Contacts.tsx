import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Users, Search, Plus, Tag as TagIcon, Phone, Mail, MessageSquare } from 'lucide-react';

export const Contacts: React.FC = () => {
  const [contacts, setContacts] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newTagModal, setNewTagModal] = useState(false);
  const [tagName, setTagName] = useState('');
  const [tagColor, setTagColor] = useState('#10B981');

  const loadData = async () => {
    try {
      const [resContacts, resTags] = await Promise.all([
        api.get('/contacts'),
        api.get('/contacts/tags/list'),
      ]);
      setContacts(resContacts.data);
      setTags(resTags.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagName.trim()) return;
    try {
      await api.post('/contacts/tags/create', { name: tagName, color: tagColor });
      setTagName('');
      setNewTagModal(false);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredContacts = contacts.filter((c) =>
    (c.name || c.phoneNumber || c.email || '')
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-6xl mx-auto overflow-y-auto h-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Contatos &amp; CRM</h1>
          <p className="text-sm text-slate-400 mt-1">
            Lista unificada de leads e clientes que interagiram com seu WhatsApp e Agente de IA.
          </p>
        </div>

        <button
          onClick={() => setNewTagModal(true)}
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-2 border border-slate-700"
        >
          <Plus className="w-4 h-4" />
          Nova Tag / Etiqueta
        </button>
      </div>

      {/* Busca e Filtros */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6 flex gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Buscar por nome, telefone ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Tags Disponíveis */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tags.map((tag) => (
          <span
            key={tag.id}
            className="px-3 py-1 rounded-lg text-xs font-medium bg-slate-900 border border-slate-800 flex items-center gap-1.5"
            style={{ borderColor: `${tag.color}40`, color: tag.color }}
          >
            <TagIcon className="w-3 h-3" />
            {tag.name}
          </span>
        ))}
      </div>

      {/* Tabela de Contatos */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
            <tr>
              <th className="px-6 py-4">Nome &amp; Contato</th>
              <th className="px-6 py-4">Telefone</th>
              <th className="px-6 py-4">Tags</th>
              <th className="px-6 py-4">Conversas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-300">
            {filteredContacts.map((contact) => (
              <tr key={contact.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 font-bold text-slate-300 flex items-center justify-center">
                      {contact.name?.[0] || 'C'}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-100">{contact.name || 'Sem Nome'}</p>
                      {contact.email && <p className="text-slate-500 text-[11px]">{contact.email}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 font-mono text-slate-400">{contact.phoneNumber}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1.5">
                    {contact.contactTags?.map((ct: any) => (
                      <span
                        key={ct.tag.id}
                        className="px-2 py-0.5 rounded text-[10px] font-medium"
                        style={{
                          backgroundColor: `${ct.tag.color}20`,
                          color: ct.tag.color,
                        }}
                      >
                        {ct.tag.name}
                      </span>
                    ))}
                    {(!contact.contactTags || contact.contactTags.length === 0) && (
                      <span className="text-slate-600 text-[10px]">—</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-400">
                  {contact._count?.conversations || 1} atendimentos
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredContacts.length === 0 && (
          <div className="p-8 text-center text-slate-500 text-xs">
            Nenhum contato encontrado.
          </div>
        )}
      </div>

      {/* Modal Criar Tag */}
      {newTagModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-bold text-base text-slate-100 mb-4">Criar Nova Tag</h3>
            <form onSubmit={handleCreateTag} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Nome da Tag</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Lead Quente, Fechou Contrato..."
                  value={tagName}
                  onChange={(e) => setTagName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Cor</label>
                <div className="flex gap-2">
                  {['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setTagColor(c)}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${
                        tagColor === c ? 'border-white scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewTagModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
