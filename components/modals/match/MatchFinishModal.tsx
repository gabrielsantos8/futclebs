
import React, { useState } from 'react';
import { supabase } from '../../../services/supabase.ts';

interface MatchFinishModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchId: string;
  onRefresh: () => void;
  onOpenVotingStatus?: () => void;
}

export const MatchFinishModal: React.FC<MatchFinishModalProps> = ({
  isOpen,
  onClose,
  matchId,
  onRefresh,
  onOpenVotingStatus
}) => {
  const [goalsA, setGoalsA] = useState(0);
  const [goalsB, setGoalsB] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFinish = async () => {
    setLoading(true);
    setError(null);
    try {
      const winner = goalsA > goalsB ? 'A' : goalsB > goalsA ? 'B' : 'draw';

      // 1. Atualizar o resultado da partida
      const { error: resultError } = await supabase
        .from('match_results')
        .update({
          goals_team_a: goalsA,
          goals_team_b: goalsB,
          winner: winner
        })
        .eq('match_id', matchId);

      if (resultError) throw new Error("É necessário sortear os times antes de finalizar a partida.");

      // 2. Mudar status da partida para finalizada
      const { error: matchError } = await supabase
        .from('matches')
        .update({ status: 'finished' })
        .eq('id', matchId);

      if (matchError) throw matchError;

      onRefresh();
      onClose();

      // Abrir modal de votação após finalizar (se callback fornecido)
      if (onOpenVotingStatus) {
        setTimeout(() => {
          onOpenVotingStatus();
        }, 300);
      }
    } catch (err: any) {
      setError(err.message || "Erro ao finalizar partida");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div>
            <h2 className="text-lg font-black text-white uppercase tracking-tight">Encerrar Partida</h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Defina o placar oficial</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 sm:p-10 space-y-8">
          <div className="flex flex-row items-center justify-between gap-2 sm:gap-6">
            <ScoreControl label="Time A" value={goalsA} onChange={setGoalsA} color="emerald" />
            
            <div className="flex flex-col items-center justify-center pt-6">
               <div className="w-8 h-px bg-slate-800 hidden sm:block mb-2"></div>
               <div className="text-xl font-black text-slate-700 italic">VS</div>
               <div className="w-8 h-px bg-slate-800 hidden sm:block mt-2"></div>
            </div>

            <ScoreControl label="Time B" value={goalsB} onChange={setGoalsB} color="blue" />
          </div>

          <div className={`p-5 rounded-2xl border transition-all duration-500 text-center ${
            goalsA === goalsB ? 'bg-slate-800/30 border-slate-700/50' : 
            goalsA > goalsB ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-blue-500/5 border-blue-500/20'
          }`}>
            <p className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest">Previsão do Resultado</p>
            <p className={`text-sm font-black uppercase tracking-tight ${
              goalsA === goalsB ? 'text-slate-400' : 
              goalsA > goalsB ? 'text-emerald-500' : 'text-blue-500'
            }`}>
              {goalsA > goalsB ? "🏆 Vitória do Time A" : goalsB > goalsA ? "🏆 Vitória do Time B" : "🤝 Empate Técnico"}
            </p>
          </div>

          <div className="space-y-4">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl animate-in shake duration-300">
                <p className="text-red-500 text-[10px] font-black uppercase text-center leading-relaxed">
                  {error}
                </p>
              </div>
            )}

            <button 
              onClick={handleFinish}
              disabled={loading}
              className="group w-full py-5 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-widest rounded-[1.25rem] transition-all shadow-xl shadow-red-600/20 active:scale-[0.97] disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Confirmar Placar Final</span>
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
            
            <p className="text-[9px] text-slate-600 text-center font-bold uppercase tracking-wider">
              {onOpenVotingStatus
                ? "Ao confirmar, você será redirecionado para gerenciar a votação."
                : "Atenção: Ao finalizar, a votação será aberta para todos os jogadores."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const ScoreControl = ({ label, value, onChange, color }: { label: string, value: number, onChange: (v: number) => void, color: string }) => (
  <div className="flex flex-col items-center gap-4 flex-1">
    <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
      color === 'emerald' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-blue-500/10 border-blue-500/20 text-blue-500'
    }`}>
      {label}
    </div>
    
    <div className="flex flex-col items-center gap-4 w-full">
      <button 
        onClick={() => onChange(value + 1)}
        className={`w-full max-w-[60px] aspect-square rounded-2xl flex items-center justify-center transition-all active:scale-90 ${
          color === 'emerald' ? 'bg-slate-800 text-emerald-500 hover:bg-emerald-500 hover:text-slate-950' : 'bg-slate-800 text-blue-500 hover:bg-blue-500 hover:text-slate-950'
        }`}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
      </button>
      
      <div className="relative">
        <span className="text-6xl font-black text-white tabular-nums">{value}</span>
        <div className={`absolute -bottom-1 left-0 right-0 h-1 rounded-full opacity-50 ${color === 'emerald' ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>
      </div>
      
      <button 
        onClick={() => onChange(Math.max(0, value - 1))}
        className="w-full max-w-[60px] aspect-square rounded-2xl bg-slate-800/50 text-slate-500 flex items-center justify-center hover:bg-slate-700 hover:text-white transition-all active:scale-90"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M20 12H4" /></svg>
      </button>
    </div>
  </div>
);
