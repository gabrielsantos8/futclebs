
import React, { useState, useEffect, useRef } from 'react';
import { supabase, MatchComment } from '../../../services/supabase';
import { SUPER_ADMIN_IDS } from '../../../constants/app.constants';

interface MatchCommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchId: string;
  currentUserId: string;
  isAdmin: boolean;
}

export const MatchCommentsModal: React.FC<MatchCommentsModalProps> = ({ isOpen, onClose, matchId, currentUserId, isAdmin }) => {
  const [comments, setComments] = useState<MatchComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isSuperUser = SUPER_ADMIN_IDS.includes(currentUserId);

  useEffect(() => {
    if (!isOpen) {
      setComments([]);
      setNewComment('');
      setLoading(false);
      return;
    }

    if (matchId) {
      fetchComments();
    }
  }, [isOpen, matchId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('match_comments')
        .select(`
          *,
          players ( name )
        `)
        .eq('match_id', matchId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formatted = (data as any[]).map(item => {
        const rawName = item.players?.name || 'Desconhecido';
        // Regra: Super User vê todos os nomes. Usuário comum vê apenas o próprio nome ou "Anônimo".
        const displayName = (isSuperUser || item.player_id === currentUserId) 
          ? rawName 
          : 'Anônimo';

        return {
          ...item,
          player_name: displayName
        };
      });

      setComments(formatted);
    } catch (err) {
      console.error('Erro ao buscar comentários:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('match_comments')
        .insert([{
          match_id: matchId,
          player_id: currentUserId,
          content: newComment.trim()
        }]);

      if (error) throw error;
      setNewComment('');
      await fetchComments();
    } catch (err) {
      console.error('Erro ao postar comentário:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (deleting) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('match_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (err) {
      console.error('Erro ao excluir comentário:', err);
      alert('Erro ao excluir comentário.');
    } finally {
      setDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-0 md:p-6 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="w-full h-full md:h-auto md:max-w-xl bg-slate-900 md:border md:border-slate-800 md:rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl md:max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">Resenha da Partida</h2>
            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-1">
              {isSuperUser ? 'Modo Super User: Nomes Visíveis' : 'Comentários Anônimos'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* List of Comments */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-950/20"
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Carregando resenha...</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-20 space-y-4 opacity-30">
              <svg className="w-16 h-16 mx-auto text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <p className="text-sm font-bold uppercase">Nenhum comentário ainda.</p>
              <p className="text-[10px] font-black uppercase tracking-widest">Seja o primeiro a mandar a letra!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div 
                key={comment.id} 
                className={`flex flex-col max-w-[85%] ${comment.player_id === currentUserId ? 'ml-auto items-end' : 'mr-auto items-start'}`}
              >
                <div className="flex items-center gap-2 mb-1 px-1">
                  <span className={`text-[9px] font-black uppercase tracking-widest ${comment.player_id === currentUserId ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {comment.player_name}
                  </span>
                  <span className="text-[8px] font-bold text-slate-700">
                    {new Date(comment.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  
                  {/* Botão de Excluir para Admins ou Dono do Comentário */}
                  {(isAdmin || comment.player_id === currentUserId) && (
                    <button 
                      onClick={() => handleDeleteComment(comment.id)}
                      disabled={deleting}
                      className="ml-1 p-1 text-slate-700 hover:text-red-500 transition-colors disabled:opacity-50"
                      title="Excluir comentário"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
                <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                  comment.player_id === currentUserId 
                    ? 'bg-emerald-600 text-slate-950 font-medium rounded-tr-none' 
                    : 'bg-slate-800 text-white rounded-tl-none border border-slate-700/50'
                }`}>
                  {comment.content}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input Area */}
        <div className="p-6 bg-slate-900 border-t border-slate-800">
          <form onSubmit={handleSendComment} className="flex gap-3">
            <input 
              type="text" 
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Mande seu comentário sobre o jogo..."
              className="flex-1 bg-slate-800 border border-slate-700 rounded-2xl px-6 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-slate-600"
              disabled={submitting}
            />
            <button 
              type="submit"
              disabled={submitting || !newComment.trim()}
              className="w-14 h-14 bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded-2xl flex items-center justify-center transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-emerald-600/20"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
              ) : (
                <svg className="w-6 h-6 rotate-90" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
