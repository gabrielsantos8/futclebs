import React, { useState, useEffect, useMemo } from 'react';
import { supabase, Player } from '@/services/supabase';
import { PlayerPositionSelectorModal } from '../player/PlayerPositionSelectorModal.tsx';
import { SUPER_ADMIN_IDS } from '@/constants/app.constants';

interface AdminUserManagementModalProps {
  isOpen: boolean;
  currentUserId: string;
  onClose: () => void;
}

export const AdminUserManagementModal: React.FC<AdminUserManagementModalProps> = ({ isOpen, currentUserId, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<Player[]>([]);
  const [search, setSearch] = useState('');
  const [resettingUserId, setResettingUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [editingPositionsUserId, setEditingPositionsUserId] = useState<string | null>(null);

  const isSuperUser = SUPER_ADMIN_IDS.includes(currentUserId);


  useEffect(() => {
    if (isOpen && isSuperUser) {
      loadPlayers();
      setResettingUserId(null);
      setMessage(null);
      setNewPassword('');
    }
  }, [isOpen, isSuperUser]);

  useEffect(() => {
    // Monitor changes in editingPositionsUserId
  }, [editingPositionsUserId, players]);

  const handleDeleteUser = async (userId: string) => {
    if (!isSuperUser) {
      setMessage({ type: 'error', text: 'Acesso negado: apenas super admins podem excluir usuários.' });
      return;
    }
    if (!userId) return;
    if (SUPER_ADMIN_IDS.includes(userId)) {
      setMessage({ type: 'error', text: 'Não é permitido deletar um super admin.' });
      return;
    }
    if (userId === currentUserId) {
      setMessage({ type: 'error', text: 'Você não pode deletar o seu próprio usuário.' });
      return;
    }

    const confirm = window.confirm('Confirma exclusão permanente deste usuário e todos os seus dados?');
    if (!confirm) return;

    setDeletingUserId(userId);
    setActionLoading(true);
    setMessage(null);

    try {
      const { error: votesError } = await supabase.from('player_votes').delete().or(`voter_id.eq.${userId},target_player_id.eq.${userId}`);
      if (votesError) console.error('Erro ao deletar votos:', votesError);

      const { error: matchPlayersError } = await supabase.from('match_players').delete().eq('player_id', userId);
      if (matchPlayersError) console.error('Erro ao deletar match_players:', matchPlayersError);

      const { error: commentsError } = await supabase.from('match_comments').delete().eq('player_id', userId);
      if (commentsError) console.error('Erro ao deletar comentários:', commentsError);

      const { error: statsError } = await supabase.from('player_stats').delete().eq('player_id', userId);
      if (statsError) console.error('Erro ao deletar stats:', statsError);

      const { data: deletedPlayer, error: delPlayerError } = await supabase
        .from('players')
        .delete()
        .eq('id', userId)
        .select();


      if (delPlayerError) {
        throw new Error(`Erro ao deletar jogador: ${delPlayerError.message}. Verifique as políticas RLS no Supabase.`);
      }

      if (!deletedPlayer || deletedPlayer.length === 0) {
        throw new Error('Usuário não foi deletado. Verifique as políticas RLS (Row Level Security) da tabela players no Supabase.');
      }

      setMessage({
        type: 'success',
        text: 'Usuário removido com sucesso! Nota: O registro Auth permanece no Supabase e deve ser removido manualmente via Dashboard > Authentication se necessário.'
      });

      await loadPlayers();
    } catch (err: any) {
      console.error('Erro ao deletar usuário:', err);
      setMessage({ type: 'error', text: err.message || 'Erro ao deletar usuário.' });
    } finally {
      setDeletingUserId(null);
      setActionLoading(false);
    }
  };

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
      {isSuperUser && (
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
                  className={`bg-slate-800/30 border rounded-2xl transition-all overflow-hidden ${resettingUserId === p.id ? 'border-emerald-500' : 'border-slate-700/50 hover:border-slate-600'}`}
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
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                            {p.phone ? `+55 ${p.phone}` : 'Sem telefone'} • {p.is_admin ? 'Administrador' : 'Jogador'}
                          </p>
                        </div>
                        {/* Posições do jogador */}
                        {p.positions && p.positions.length > 0 && (
                          <div className="flex items-center gap-1 mt-1.5">
                            {p.positions.map((pos) => (
                              <span
                                key={pos}
                                className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded text-[9px] font-black uppercase"
                              >
                                {pos === 'goalkeeper' ? '🧤 GOL' :
                                 pos === 'defender' ? '🛡️ DEF' :
                                 pos === 'midfielder' ? '⚽ MEI' :
                                 pos === 'forward' ? '🎯 ATA' : pos}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingPositionsUserId(p.id)}
                        className="px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all bg-blue-600 text-white hover:bg-blue-500"
                        title="Editar posições"
                      >
                        📍 Posições
                      </button>
                      <button
                        onClick={() => setResettingUserId(resettingUserId === p.id ? null : p.id)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${resettingUserId === p.id
                          ? 'bg-slate-700 text-white'
                          : 'bg-emerald-600 text-slate-950 hover:bg-emerald-500'
                          }`}
                      >
                        {resettingUserId === p.id ? 'Cancelar' : 'Alterar Senha'}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(p.id)}
                        disabled={actionLoading || deletingUserId === p.id || SUPER_ADMIN_IDS.includes(p.id) || p.id === currentUserId}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                          SUPER_ADMIN_IDS.includes(p.id) || p.id === currentUserId
                            ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                            : deletingUserId === p.id || actionLoading
                            ? 'bg-red-600/60 text-white opacity-70'
                            : 'bg-red-600 text-white hover:bg-red-500'
                          }`}
                        title={SUPER_ADMIN_IDS.includes(p.id) ? 'Super admins não podem ser deletados' : p.id === currentUserId ? 'Você não pode deletar a si mesmo' : 'Deletar usuário'}
                      >
                        {deletingUserId === p.id ? 'Deletando...' : 'Deletar'}
                      </button>
                    </div>
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
      )}

      {!isSuperUser && (
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
      )}

    {editingPositionsUserId && (
      <PlayerPositionSelectorModal
        isOpen={true}
        onClose={() => setEditingPositionsUserId(null)}
        playerId={editingPositionsUserId}
        playerName={players.find(p => p.id === editingPositionsUserId)?.name || ''}
        isGoalkeeper={players.find(p => p.id === editingPositionsUserId)?.is_goalkeeper || false}
        currentPositions={players.find(p => p.id === editingPositionsUserId)?.positions || null}
        onSave={() => {
          loadPlayers();
          setEditingPositionsUserId(null);
        }}
      />
    )}
    </>
  );
};
