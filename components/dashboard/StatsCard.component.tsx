import React from 'react';
import { Player, PlayerStats } from '../../services/supabase.ts';

interface StatsCardProps {
  userProfile: Player;
  userStats: PlayerStats | null;
  onOpenStats: () => void;
  onOpenAvatar: () => void;
  onOpenPositions: () => void;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  userProfile,
  userStats,
  onOpenStats,
  onOpenAvatar,
  onOpenPositions
}) => {
  return (
    <div
      onClick={onOpenStats}
      className="group relative overflow-hidden bg-gradient-to-br from-emerald-600 to-emerald-800 p-6 rounded-[2.5rem] shadow-2xl cursor-pointer active:scale-95 transition-all"
    >
      <div className="flex justify-between items-center relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenAvatar();
              }}
              className="relative group/avatar"
              title="Editar avatar"
            >
              <div className="relative">
                {userProfile.avatar ? (
                  <img
                    src={userProfile.avatar}
                    alt="Avatar"
                    className="w-10 h-10 rounded-full object-cover border-2 border-white/30 transition-all duration-300 group-hover/avatar:scale-105 group-hover/avatar:border-white/70 shadow-lg shadow-black/30"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center border-2 border-white/10 transition-all duration-300 group-hover/avatar:scale-105 group-hover/avatar:border-white/40 shadow-lg shadow-black/30">
                    <span className="text-white font-black text-xl">
                      {userProfile.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 rounded-full opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-300 ring-2 ring-white/40" />
              </div>

              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-950 border border-white/20 flex items-center justify-center transition-all duration-300 group-hover/avatar:scale-110 group-hover/avatar:border-white/50">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536M9 11l6.732-6.732a2.5 2.5 0 013.536 3.536L12.536 14.536a2.5 2.5 0 01-1.768.732H9v-2.732A2.5 2.5 0 019.732 11z" />
                </svg>
              </div>
            </button>

            <p className="text-emerald-200 text-[10px] font-black uppercase tracking-widest">Seu Nível</p>
            <span className="px-2 py-0.5 bg-white/20 backdrop-blur-md rounded-full text-[8px] font-black text-white uppercase border border-white/10 tracking-widest">
              {userProfile.is_goalkeeper ? 'Goleiro' : 'Linha'}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-5xl font-black text-white tabular-nums">
              {userStats?.overall ? Math.round(Number(userStats.overall) * 20) : '--'}
            </span>
            <span className="text-emerald-300 font-bold">OVR</span>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenPositions();
              }}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg text-[10px] font-black text-white uppercase border border-white/10 tracking-widest transition-all flex items-center gap-1.5"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {userProfile.positions && userProfile.positions.length > 0
                ? userProfile.positions.join(' • ')
                : 'Definir Posições'}
            </button>
          </div>
        </div>

        <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 backdrop-blur-md group-hover:scale-110 transition-transform">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
      </div>
    </div>
  );
};

