import React, { useEffect, useMemo, useState } from 'react';
import { PlayerStats } from '../services/supabase';

interface MiniStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  name: string;
  isGoalkeeper: boolean;
  stats: PlayerStats | null;
  avatar: string | null;
}

export const MiniStatsModal: React.FC<MiniStatsModalProps> = ({
  isOpen,
  onClose,
  name,
  isGoalkeeper,
  stats,
  avatar,
}) => {
  const SCALING = 20;

  const [animateBars, setAnimateBars] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAnimateBars(false);
      const t = setTimeout(() => setAnimateBars(true), 80);
      return () => clearTimeout(t);
    }
    setAnimateBars(false);
  }, [isOpen]);

  const allStatItems = useMemo(
    () => [
      { label: 'VEL', value: (stats?.velocidade || 0) * SCALING, color: 'bg-blue-500', key: 'VEL' },
      { label: 'FIN', value: (stats?.finalizacao || 0) * SCALING, color: 'bg-red-500', key: 'FIN' },
      { label: 'PAS', value: (stats?.passe || 0) * SCALING, color: 'bg-emerald-500', key: 'PAS' },
      { label: 'DRI', value: (stats?.drible || 0) * SCALING, color: 'bg-yellow-500', key: 'DRI' },
      { label: 'DEF', value: (stats?.defesa || 0) * SCALING, color: 'bg-slate-500', key: 'DEF' },
      { label: 'FIS', value: (stats?.fisico || 0) * SCALING, color: 'bg-orange-500', key: 'FIS' },
    ],
    [stats]
  );

  const statItems = useMemo(
    () => (isGoalkeeper ? allStatItems.filter((i) => i.key === 'PAS' || i.key === 'DEF') : allStatItems),
    [allStatItems, isGoalkeeper]
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xs rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl
                   animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative bg-slate-900/95 backdrop-blur-xl animate-[floaty_3.5s_ease-in-out_infinite]">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-14 -left-12 w-52 h-52 rounded-full bg-emerald-500/12 blur-3xl animate-pulse" />
            <div className="absolute -bottom-16 -right-14 w-56 h-56 rounded-full bg-blue-500/10 blur-3xl animate-pulse" />
            <div className="absolute -inset-16 rotate-12 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[shimmer_4s_linear_infinite]" />
          </div>

          <div className="relative px-6 pt-6 pb-5 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/20 border-b border-white/5">
            <div className="relative flex justify-between items-start">
              <div className="flex items-start gap-4">
                <div className="relative group">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400/40 to-white/10 blur-md opacity-70 group-hover:opacity-100 transition-opacity" />

                  <div className="relative w-20 h-20 rounded-full p-[2px] bg-gradient-to-br from-emerald-400/80 via-white/20 to-slate-700/40 shadow-xl
                                  transition-all duration-300 group-hover:scale-[1.04]">
                    <div className="w-full h-full rounded-full overflow-hidden bg-slate-900 border border-white/10 flex items-center justify-center">
                      {avatar ? (
                        <img
                          src={avatar}
                          alt="Avatar"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.08]"
                        />
                      ) : (
                        <span className="text-white font-black text-3xl">
                          {name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="absolute inset-0 rounded-full ring-2 ring-white/0 group-hover:ring-white/20 transition-all duration-500" />

                  {isGoalkeeper && (
                    <div className="absolute -bottom-1 -right-1 px-2 py-1 rounded-xl bg-orange-500 text-slate-950 text-[9px]
                                    font-black uppercase shadow-lg border border-orange-300/30
                                    animate-[pop_1.6s_ease-in-out_infinite]">
                      GK
                    </div>
                  )}
                </div>

                <div className="pt-1">
                  <h3 className="text-lg font-black text-white leading-tight">
                    {name}
                  </h3>

                  <div className="flex items-end gap-2 mt-2">
                    <span className="text-4xl font-black text-emerald-500 tabular-nums leading-none animate-in fade-in duration-300">
                      {stats?.overall ? Math.round(Number(stats.overall) * SCALING) : '--'}
                    </span>
                    <span className="text-[10px] font-black text-emerald-500/60 uppercase pb-1 tracking-widest">
                      Overall
                    </span>
                  </div>

                  <p className="mt-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    {isGoalkeeper ? 'Goleiro' : 'Linha'}
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white border border-white/10
                           transition-all active:scale-95 hover:scale-[1.03]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="relative p-6">
            <div className={`grid ${isGoalkeeper ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
              {statItems.map((item, idx) => (
                <div
                  key={item.label}
                  className="space-y-1 animate-in fade-in slide-in-from-bottom-1 duration-300"
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <div className="flex justify-between text-[10px] font-black text-slate-500 px-0.5">
                    <span>{item.label}</span>
                    <span className="text-white">{Math.round(Number(item.value))}</span>
                  </div>

                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} transition-[width] duration-700 ease-out`}
                      style={{
                        width: animateBars ? `${item.value}%` : '0%',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={onClose}
              className="w-full mt-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest
                         bg-slate-800 hover:bg-slate-700 text-white transition-all
                         shadow-lg shadow-black/20 active:scale-[0.99] hover:scale-[1.01]"
            >
              Fechar
            </button>

            <div className="mt-3 text-center">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
                toque fora para fechar
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes floaty {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
          100% { transform: translateY(0px); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-30%); opacity: .0; }
          15% { opacity: .7; }
          50% { opacity: .35; }
          100% { transform: translateX(30%); opacity: .0; }
        }
        @keyframes pop {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.06); }
        }
      `}</style>
    </div>
  );
};
