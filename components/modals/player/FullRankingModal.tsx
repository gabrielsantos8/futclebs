
import React, { useState, useMemo } from 'react';
import { PlayerStats } from '../../../services/supabase.ts';

interface RankingPlayer {
  id: string;
  name: string;
  is_goalkeeper: boolean;
  stats: PlayerStats | null;
}

interface FullRankingModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: RankingPlayer[];
  onPlayerClick: (player: RankingPlayer) => void;
}

export const FullRankingModal: React.FC<FullRankingModalProps> = ({ isOpen, onClose, players, onPlayerClick }) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'field' | 'gk'>('all');

  const filteredPlayers = useMemo(() => {
    return players
      .filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
        if (filter === 'all') return matchesSearch;
        if (filter === 'field') return matchesSearch && !p.is_goalkeeper;
        if (filter === 'gk') return matchesSearch && p.is_goalkeeper;
        return matchesSearch;
      })
      .sort((a, b) => (b.stats?.overall || 0) - (a.stats?.overall || 0));
  }, [players, search, filter]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-0 md:p-4 bg-black/98 backdrop-blur-2xl animate-in fade-in duration-300">
      <div className="w-full h-full md:h-auto md:max-w-2xl bg-slate-900 md:border md:border-slate-800 md:rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl max-h-screen md:max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">Ranking Geral</h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Todos os craques cadastrados</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Filters */}
        <div className="p-6 space-y-4 bg-slate-950/30 border-b border-slate-800">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Buscar por nome..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl px-12 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-slate-600"
            />
            <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <div className="flex gap-2">
            <FilterBtn active={filter === 'all'} onClick={() => setFilter('all')} label="Todos" />
            <FilterBtn active={filter === 'field'} onClick={() => setFilter('field')} label="Linha" />
            <FilterBtn active={filter === 'gk'} onClick={() => setFilter('gk')} label="Goleiros" />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar pb-10">
          {filteredPlayers.length === 0 ? (
            <div className="text-center py-20 opacity-20">
              <p className="font-black uppercase text-xs">Nenhum craque encontrado</p>
            </div>
          ) : (
            filteredPlayers.map((player, idx) => {
              const overall = player.stats?.overall ? Math.round(Number(player.stats.overall) * 20) : 0;
              const rank = idx + 1;
              
              return (
                <div 
                  key={player.id}
                  onClick={() => onPlayerClick(player)}
                  className="flex items-center gap-4 p-4 bg-slate-800/40 border border-slate-700/50 rounded-2xl hover:bg-slate-800/70 hover:border-emerald-500/30 transition-all cursor-pointer group"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                    rank === 1 ? 'bg-yellow-400 text-slate-900' :
                    rank === 2 ? 'bg-slate-300 text-slate-900' :
                    rank === 3 ? 'bg-amber-600 text-white' :
                    'bg-slate-900 text-slate-500 border border-slate-800'
                  }`}>
                    {rank}º
                  </div>
                  {player.avatar ? (
                    <img
                      src={player.avatar}
                      alt={player.name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-700"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center">
                      <span className="text-sm font-bold text-slate-400 uppercase">{player.name.charAt(0)}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white truncate group-hover:text-emerald-400 transition-colors">
                        {player.name}
                      </h4>
                      {player.is_goalkeeper && (
                        <span className="text-[8px] font-black bg-orange-500/20 text-orange-500 px-1.5 py-0.5 rounded uppercase border border-orange-500/20">GK</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <span className="text-xl font-black text-white tabular-nums leading-none block">
                        {overall || '--'}
                      </span>
                      <span className="text-[8px] font-black text-slate-600 uppercase tracking-tighter">OVR</span>
                    </div>
                    <div className="p-2 text-slate-700 group-hover:text-emerald-500 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

const FilterBtn = ({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) => (
  <button 
    onClick={onClick}
    className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
      active 
        ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-600/10' 
        : 'bg-slate-800/50 border-slate-700/50 text-slate-500 hover:text-slate-300 hover:border-slate-600'
    }`}
  >
    {label}
  </button>
);
