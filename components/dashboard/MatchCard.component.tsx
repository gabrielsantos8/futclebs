import React from 'react';
import { MatchWithExtras } from '@/types/app.types';
import { Player } from '@/services/supabase';

interface MatchCardProps {
  match: MatchWithExtras;
  userProfile: Player;
  isSuperAdmin: boolean;
  activeAdminMenu: string | null;
  setActiveAdminMenu: (id: string | null) => void;
  onOpenPlayers: () => void;
  onOpenVote: () => void;
  onOpenSummary: () => void;
  onOpenTeamSorting: () => void;
  onOpenComments: () => void;
  onOpenAdminManagement: () => void;
  onOpenMatchFinish: () => void;
  onOpenVotingStatus: () => void;
  onOpenDeleteConfirm: () => void;
}

export const MatchCard: React.FC<MatchCardProps> = ({
  match,
  userProfile,
  isSuperAdmin,
  activeAdminMenu,
  setActiveAdminMenu,
  onOpenPlayers,
  onOpenVote,
  onOpenSummary,
  onOpenTeamSorting,
  onOpenComments,
  onOpenAdminManagement,
  onOpenMatchFinish,
  onOpenVotingStatus,
  onOpenDeleteConfirm
}) => {
  return (
    <div className="bg-slate-900/60 p-5 rounded-[2rem] border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center gap-6 hover:border-emerald-500/30 transition-all">
      <div className="flex items-center gap-4 w-full">
        <div className="w-16 h-16 bg-slate-800 rounded-2xl flex flex-col items-center justify-center text-emerald-500 font-bold shrink-0 border border-slate-700/50">
          <span className="text-lg leading-none">{match.match_date.split('-')[2]}</span>
          <span className="text-[10px] opacity-60 uppercase">
            {new Date(match.match_date + 'T12:00:00').toLocaleString('pt-BR', { month: 'short' }).replace('.', '')}
          </span>
          <span className="text-[8px] opacity-40 font-black">{match.match_date.split('-')[0]}</span>
        </div>

        <div className="flex-1 overflow-hidden">
          <h3 className="text-white font-bold truncate">Pelada Clebinho</h3>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                match.status === 'open'
                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                  : match.hasPendingVotes
                  ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {match.hasPendingVotes ? 'Votar' : match.status === 'open' ? 'Aberta' : 'Finalizada'}
            </span>
            <span className="text-slate-500 text-[10px] font-bold">• {match.playerCount} Confirmados</span>
          </div>
        </div>
      </div>

      <div className="w-full flex flex-col gap-4 mt-2 sm:mt-0 sm:w-auto">
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-3 w-full">
          {match.status === 'finished' && !match.hasPendingVotes && (
            <button
              onClick={onOpenComments}
              className="px-3 py-3 bg-slate-800/80 text-emerald-500 hover:text-emerald-400 border border-emerald-500/20 rounded-xl font-black text-[9px] sm:text-[10px] uppercase transition-all flex items-center justify-center gap-2 whitespace-nowrap shadow-lg shadow-emerald-500/5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              Resenha
            </button>
          )}

          {(match.status === 'open' || match.status === 'finished') && (
            <button
              onClick={onOpenTeamSorting}
              className="px-3 py-3 bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700/50 rounded-xl font-black text-[9px] sm:text-[10px] uppercase transition-all flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Escalação
            </button>
          )}

          <button
            onClick={() => {
              if (match.hasPendingVotes) onOpenVote();
              else if (match.status === 'finished') onOpenSummary();
              else onOpenPlayers();
            }}
            className={`px-3 py-3 rounded-xl font-black text-[9px] sm:text-[10px] uppercase transition-all shadow-lg text-center flex items-center justify-center gap-2 ${
              match.hasPendingVotes
                ? 'bg-orange-600 hover:bg-orange-500 text-slate-950 shadow-orange-600/20'
                : match.status === 'open'
                ? 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 shadow-emerald-600/20'
                : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700/30'
            }`}
          >
            {match.hasPendingVotes ? 'Votar Agora' : match.status === 'open' ? 'Inscritos' : 'Resumo'}
          </button>
        </div>

        {userProfile.is_admin && (
          <div className="w-full">
            {match.status === 'open' && (
              <>
                {activeAdminMenu === match.id ? (
                  <div className="flex flex-wrap gap-1.5 animate-in slide-in-from-top-2 duration-300 justify-center sm:justify-end">
                    <button
                      onClick={onOpenAdminManagement}
                      className="px-3 py-2 bg-slate-800 text-white rounded-lg font-black text-[8px] uppercase hover:bg-slate-700 transition-all border border-slate-700/50"
                    >
                      Lista
                    </button>
                    <button
                      onClick={onOpenTeamSorting}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg font-black text-[8px] uppercase hover:bg-blue-500 transition-all border border-blue-400/30"
                    >
                      Sortear
                    </button>
                    <button
                      onClick={onOpenMatchFinish}
                      className="px-3 py-2 bg-red-600 text-white rounded-lg font-black text-[8px] uppercase hover:bg-red-500 transition-all border border-red-400/30"
                    >
                      Finalizar
                    </button>
                    <button
                      onClick={onOpenDeleteConfirm}
                      className="px-3 py-2 bg-red-950/50 text-red-500 border border-red-900/30 rounded-lg font-black text-[8px] uppercase hover:bg-red-600 hover:text-white transition-all"
                    >
                      Excluir
                    </button>
                    <button
                      onClick={() => setActiveAdminMenu(null)}
                      className="p-2 bg-slate-800 text-slate-400 rounded-lg hover:text-white border border-slate-700/50"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setActiveAdminMenu(match.id)}
                    className="w-full sm:w-auto px-4 py-2.5 bg-slate-900 text-slate-400 hover:text-white border border-slate-800 rounded-xl font-black text-[9px] uppercase transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Painel Admin
                  </button>
                )}
              </>
            )}

            {match.status === 'finished' && isSuperAdmin && (
              <div className="grid grid-cols-2 gap-3 w-full">
                <button
                  onClick={onOpenVotingStatus}
                  className="px-3 py-3 bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700/50 rounded-xl font-black text-[9px] sm:text-[10px] uppercase transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  <span className="hidden sm:inline">Status</span>
                  <span className="sm:hidden">Status</span>
                </button>

                <button
                  onClick={onOpenDeleteConfirm}
                  className="px-3 py-3 bg-red-950/50 text-red-500 hover:text-red-400 border border-red-900/30 rounded-xl font-black text-[9px] sm:text-[10px] uppercase transition-all flex items-center justify-center gap-2 whitespace-nowrap hover:bg-red-900/30"
                  title="Excluir partida do histórico"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span className="hidden sm:inline">Excluir</span>
                  <span className="sm:hidden">Excluir</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

