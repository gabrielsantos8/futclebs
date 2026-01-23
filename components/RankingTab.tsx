
import React, { useEffect, useState } from 'react';
import { supabase, PlayerStats } from '../services/supabase';
import { FullRankingModal } from './FullRankingModal';

interface RankingPlayer {
  id: string;
  name: string;
  is_goalkeeper: boolean;
  stats: PlayerStats | null;
  avatar: string | null;
}

interface RankingTabProps {
  onPlayerClick: (player: RankingPlayer) => void;
}

export const RankingTab: React.FC<RankingTabProps> = ({ onPlayerClick }) => {
  const [loading, setLoading] = useState(true);
  const [allPlayers, setAllPlayers] = useState<RankingPlayer[]>([]);
  const [fieldRanking, setFieldRanking] = useState<RankingPlayer[]>([]);
  const [gkRanking, setGkRanking] = useState<RankingPlayer[]>([]);
  const [isFullRankingOpen, setIsFullRankingOpen] = useState(false);

  useEffect(() => {
    fetchRankings();
  }, []);

  const fetchRankings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('players')
        .select(`
          id,
          name,
          is_goalkeeper,
          player_stats (*),
          avatar
        `);

      if (error) throw error;

      const players: RankingPlayer[] = (data as any[]).map(p => ({
        id: p.id,
        name: p.name,
        is_goalkeeper: p.is_goalkeeper,
        stats: Array.isArray(p.player_stats) ? p.player_stats[0] : p.player_stats,
        avatar: p.avatar
      }));

      setAllPlayers(players);

      // Ordenar por Overall para os Top 3
      const sortedField = [...players]
        .filter(p => !p.is_goalkeeper)
        .sort((a, b) => (b.stats?.overall || 0) - (a.stats?.overall || 0))
        .slice(0, 3);

      const sortedGk = [...players]
        .filter(p => p.is_goalkeeper)
        .sort((a, b) => (b.stats?.overall || 0) - (a.stats?.overall || 0))
        .slice(0, 3);

      setFieldRanking(sortedField);
      setGkRanking(sortedGk);
    } catch (err) {
      console.error('Erro ao buscar rankings:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Montando o Hall da Fama...</p>
      </div>
    );
  }

  return (
    <div className="space-y-16 animate-in fade-in duration-700 pb-20">
      <div className="flex justify-center px-4">
        <button 
          onClick={() => setIsFullRankingOpen(true)}
          className="group relative px-8 py-4 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-emerald-500/50 transition-all active:scale-95"
        >
          <div className="flex items-center gap-3 relative z-10">
            <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <span className="text-xs font-black text-white uppercase tracking-widest">Ver Ranking Completo</span>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-emerald-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
        </button>
      </div>

      {/* Categoria: Jogadores de Linha */}
      <section>
        <div className="text-center mb-24">
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Elite de Linha</h2>
          <p className="text-emerald-500 text-[9px] font-black uppercase tracking-[0.3em] mt-2">O Top 3 Atual</p>
        </div>
        
        {fieldRanking.length > 0 ? (
          <Podium players={fieldRanking} onPlayerClick={onPlayerClick} />
        ) : (
          <EmptyState />
        )}
      </section>

      {/* Categoria: Goleiros */}
      <section>
        <div className="text-center mb-24">
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Muralhas</h2>
          <p className="text-orange-500 text-[9px] font-black uppercase tracking-[0.3em] mt-2">Os Guardiões Imbatíveis</p>
        </div>
        
        {gkRanking.length > 0 ? (
          <Podium players={gkRanking} onPlayerClick={onPlayerClick} variant="orange" />
        ) : (
          <EmptyState />
        )}
      </section>

      <FullRankingModal 
        isOpen={isFullRankingOpen} 
        onClose={() => setIsFullRankingOpen(false)} 
        players={allPlayers}
        onPlayerClick={(p) => {
          setIsFullRankingOpen(false);
          onPlayerClick(p);
        }}
      />
    </div>
  );
};

const Podium: React.FC<{ players: RankingPlayer[], onPlayerClick: (p: RankingPlayer) => void, variant?: 'emerald' | 'orange' }> = ({ players, onPlayerClick, variant = 'emerald' }) => {
  const podiumOrder: (RankingPlayer & { rank: number })[] = [];
  if (players[1]) podiumOrder.push({ ...players[1], rank: 2 });
  if (players[0]) podiumOrder.push({ ...players[0], rank: 1 });
  if (players[2]) podiumOrder.push({ ...players[2], rank: 3 });

  return (
    <div className="flex items-end justify-center gap-3 sm:gap-6 px-4 h-64 sm:h-72">
      {podiumOrder.map((player) => (
        <PodiumStep 
          key={player.id} 
          player={player} 
          rank={player.rank} 
          onClick={() => onPlayerClick(player)} 
          variant={variant}
        />
      ))}
    </div>
  );
};

const PodiumStep: React.FC<{ player: RankingPlayer, rank: number, onClick: () => void, variant: 'emerald' | 'orange' }> = ({ player, rank, onClick, variant }) => {
  const isFirst = rank === 1;
  const isSecond = rank === 2;
  const isThird = rank === 3;

  // Barras de tamanho uniforme conforme solicitado
  const heightClass = 'h-full';
  
  const colorClass = isFirst ? 'from-yellow-400 to-yellow-600 shadow-yellow-500/30' : 
                     isSecond ? 'from-slate-300 to-slate-500 shadow-slate-400/20' : 
                     'from-amber-600 to-amber-800 shadow-amber-700/20';
  
  const overall = player.stats?.overall ? Math.round(Number(player.stats.overall) * 20) : 0;
console.log(player);
  return (
    <div 
      onClick={onClick}
      className={`relative flex flex-col items-center justify-end w-full max-w-[130px] transition-all duration-700 cursor-pointer group hover:-translate-y-2 ${heightClass}`}
    >
      {/* Avatar Section - Todos na mesma altura */}
      <div className={`absolute -top-16 sm:-top-20 z-20 flex flex-col items-center animate-in zoom-in duration-1000 delay-300`}>
        {isFirst && (
          <div className="animate-bounce mb-1">
            <svg className="w-8 h-8 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a3 3 0 01-3-3V6zm3 2V5a1 1 0 00-1 1v4a1 1 0 001 1h8l-2-2.667L14 8l-2-2.667L10 8l-2-2.667L6 8z" clipRule="evenodd" />
            </svg>
          </div>
        )}
        {!isFirst && <div className="h-9"></div> /* Espaçador para manter altura uniforme quando não há coroa */}
        
        <div className={`w-14 h-14 sm:w-20 sm:h-20 rounded-full border-4 flex items-center justify-center font-black text-white text-xl sm:text-3xl shadow-2xl overflow-hidden relative transition-transform group-hover:scale-110 ${
          isFirst ? 'border-yellow-500 bg-yellow-500/20' : 
          isSecond ? 'border-slate-400 bg-slate-400/20' : 
          'border-amber-700 bg-amber-700/20'
        }`}>
          {player.avatar ? (
            <img 
              src={player.avatar}
              alt="Avatar"
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <span className="text-white font-black text-xl sm:text-3xl">
              {player.name.charAt(0).toUpperCase()}
            </span>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
        </div>
      </div>

      {/* Visual Block of the Podium - Uniforme */}
      <div className={`w-full bg-gradient-to-b ${colorClass} rounded-t-[2rem] shadow-2xl flex flex-col items-center pt-8 pb-5 relative overflow-hidden group-hover:brightness-110 transition-all border-x border-t border-white/20`}>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        
        <span className="text-black/10 text-8xl font-black absolute -bottom-6 left-1/2 -translate-x-1/2 select-none italic pointer-events-none">
          {rank}
        </span>

        <div className="relative z-10 flex flex-col items-center text-center px-2">
          <span className="text-slate-950 font-black text-3xl sm:text-4xl leading-none tabular-nums drop-shadow-md">
            {overall}
          </span>
          <span className="text-slate-950/50 font-black text-[9px] uppercase tracking-widest mt-1">
            OVR
          </span>
        </div>
      </div>

      {/* Name and decorative line */}
      <div className="mt-4 text-center w-full px-2">
        <p className={`text-[11px] font-black truncate leading-tight ${isFirst ? 'text-white' : 'text-slate-400'}`}>
          {player.name.split(' ')[0]}
        </p>
      </div>
    </div>
  );
};

const EmptyState = () => (
  <div className="text-center py-10 opacity-30">
    <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-dashed border-slate-700">
      <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
      </svg>
    </div>
    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Aguardando dados da rodada...</p>
  </div>
);
