
import React, { useState, useEffect, useMemo } from 'react';
import { supabase, Player } from '../services/supabase';

interface AdminUserManagementModalProps {
  isOpen: boolean;
  currentUserId: string;
  onClose: () => void;
}

const SUPER_USER_ID = '5e05a3d9-3a9a-4ad0-99f7-72315bbf5990';

export const AdminUserManagementModal: React.FC<AdminUserManagementModalProps> = ({ isOpen, currentUserId, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<Player[]>([]);
  const [search, setSearch] = useState('');
  const [resettingUserId, setResettingUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const isSuperUser = currentUserId === SUPER_USER_ID;


  useEffect(() => {
    if (isOpen && isSuperUser) {
      loadPlayers();
      setResettingUserId(null);
      setMessage(null);
      setNewPassword('');
    }
  }, [isOpen]);

  const loadPlayers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setPlayers(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredPlayers = useMemo(() => {
    return players.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.phone.includes(search)
    );
  }, [players, search]);

  const handleResetPassword = async () => {
    if (!resettingUserId || newPassword.length < 6) return;

    setActionLoading(true);
    setMessage(null);
    try {
      // NOTE: Standard Supabase client requires Service Role key for this operation
      // If the app is using an Edge Function, call it here.
      // Otherwise, we attempt the auth.admin call which may require elevated permissions.
      const { error } = await supabase.auth.admin.updateUserById(
        resettingUserId,
        { password: newPassword }
      );

      if (error) throw error;

      setMessage({ type: 'success', text: 'Senha alterada com sucesso!' });
      setNewPassword('');
      setTimeout(() => setResettingUserId(null), 2000);
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: err.message || 'Erro ao alterar senha. Verifique as permissões de admin.' });
    } finally {
      setActionLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      isSuperUser && (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 sm:p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
        <div className="w-full h-full sm:h-auto sm:max-w-2xl bg-slate-950 sm:bg-slate-900 border-none sm:border sm:border-slate-800 sm:rounded-[2.5rem] overflow-hidden flex flex-col max-h-screen sm:max-h-[85vh] shadow-2xl">

          {/* Header */}
          <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">Gestão de Usuários</h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Recuperação de Acesso</p>
            </div>
            <button onClick={onClose} className="p-3 hover:bg-slate-800 rounded-2xl transition-colors text-slate-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search Bar */}
          <div className="p-6 border-b border-slate-800 bg-slate-950/20">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por nome ou telefone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl px-12 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-slate-600"
              />
              <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                <p className="text-slate-500 font-black uppercase text-[10px] tracking-widest">Carregando jogadores...</p>
              </div>
            ) : filteredPlayers.length === 0 ? (
              <div className="text-center py-20 opacity-20">
                <p className="font-black uppercase text-xs">Nenhum jogador encontrado</p>
              </div>
            ) : (
              filteredPlayers.map(p => (
                <div
                  key={p.id}
                  className={`bg-slate-800/30 border rounded-2xl transition-all overflow-hidden ${resettingUserId === p.id ? 'border-emerald-500' : 'border-slate-700/50 hover:border-slate-600'
                    }`}
                >
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white shrink-0 ${p.is_goalkeeper ? 'bg-orange-500/20 text-orange-500 border border-orange-500/20' : 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/20'}`}>
                        {p.avatar ? (
                          <img src={p.avatar} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                        ) : (
                          <span className="text-white font-black text-xl">
                            {p.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-bold text-white truncate">{p.name}</p>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                          {p.phone ? `+55 ${p.phone}` : 'Sem telefone'} • {p.is_admin ? 'Administrador' : 'Jogador'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setResettingUserId(resettingUserId === p.id ? null : p.id)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${resettingUserId === p.id
                        ? 'bg-slate-700 text-white'
                        : 'bg-emerald-600 text-slate-950 hover:bg-emerald-500'
                        }`}
                    >
                      {resettingUserId === p.id ? 'Cancelar' : 'Alterar Senha'}
                    </button>
                  </div>

                  {/* Reset Form Section */}
                  {resettingUserId === p.id && (
                    <div className="p-6 bg-slate-950/40 border-t border-slate-800/50 space-y-4 animate-in slide-in-from-top-4 duration-300">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nova Senha</label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Mínimo 6 caracteres"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                          autoFocus
                        />
                      </div>

                      {message && (
                        <p className={`text-[10px] font-black uppercase text-center py-2 rounded-lg border ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500'
                          }`}>
                          {message.text}
                        </p>
                      )}

                      <button
                        onClick={handleResetPassword}
                        disabled={actionLoading || newPassword.length < 6}
                        className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs uppercase rounded-xl transition-all shadow-lg disabled:opacity-50 flex items-center justify-center"
                      >
                        {actionLoading ? (
                          <div className="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                        ) : (
                          'Salvar Nova Senha'
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      )

      !isSuperUser && (
      <>
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl p-6">
            <h2 className="text-xl font-black text-white uppercase tracking-tight mb-4">Acesso Negado</h2>
            <p className="text-sm text-slate-400">Por motivos de segurança, sessa ação só pode ser executada de forma local.</p>
            <button
              onClick={onClose}
              className="mt-6 w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs uppercase rounded-xl transition-all shadow-lg flex items-center justify-center"
            >
              Fechar
            </button>
          </div>
        </div>
      </>
      )
    </>
  );
};
