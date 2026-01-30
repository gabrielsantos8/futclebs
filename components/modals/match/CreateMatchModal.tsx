
import React, { useState } from 'react';
import { supabase } from '../../../services/supabase.ts';
import { Input } from '../shared/Input.tsx';

interface CreateMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export const CreateMatchModal: React.FC<CreateMatchModalProps> = ({ isOpen, onClose, onRefresh }) => {
  const [matchDate, setMatchDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchDate) return setError('Selecione uma data');
    
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error: insertError } = await supabase
        .from('matches')
        .insert([{
          match_date: matchDate,
          status: 'open',
          created_by: user?.id
        }]);

      if (insertError) throw insertError;

      onRefresh();
      onClose();
      setMatchDate('');
    } catch (err: any) {
      setError(err.message || 'Erro ao criar partida');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div>
            <h2 className="text-lg font-black text-white uppercase tracking-tight">Nova Partida</h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Agende a próxima pelada</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <Input 
            label="Data da Partida" 
            type="date" 
            value={matchDate} 
            onChange={e => setMatchDate(e.target.value)} 
            required 
            min={new Date().toISOString().split('T')[0]}
          />

          {error && (
            <p className="text-red-500 text-[10px] font-black uppercase text-center bg-red-500/10 py-2 rounded-lg border border-red-500/20">
              {error}
            </p>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs uppercase rounded-2xl transition-all shadow-xl shadow-emerald-600/20 active:scale-[0.97] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Agendar Agora
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
