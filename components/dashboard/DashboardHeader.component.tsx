import React from 'react';
import { Player } from '../../services/supabase.ts';

interface DashboardHeaderProps {
  userProfile: Player;
  isSuperAdmin: boolean;
  onOpenUserManagement: () => void;
  onOpenCreateMatch: () => void;
  onLogout: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  userProfile,
  isSuperAdmin,
  onOpenUserManagement,
  onOpenCreateMatch,
  onLogout
}) => {
  return (
    <header className="flex justify-between items-center">
      <div>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">FutClebs • Dashboard</p>
        <h1 className="text-2xl font-black text-white">{userProfile.name}</h1>
        {userProfile.is_admin && (
          <span className="text-[10px] font-black bg-white text-slate-950 px-2 py-0.5 rounded-full uppercase tracking-tighter border border-white/20">
            Modo Admin
          </span>
        )}
      </div>

      <div className="flex gap-2">
        {isSuperAdmin && (
          <button
            onClick={onOpenUserManagement}
            className="flex-1 sm:flex-none px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/50 rounded-xl transition-all text-xs font-black uppercase"
          >
            Gerenciar Usuários
          </button>
        )}

        {userProfile.is_admin && (
          <button
            onClick={onOpenCreateMatch}
            className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded-xl transition-all text-xs font-black uppercase shadow-lg shadow-emerald-600/20"
          >
            Criar Partida
          </button>
        )}

        <button
          onClick={onLogout}
          className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-500 hover:text-white transition-all text-xs font-black uppercase"
        >
          Sair
        </button>
      </div>
    </header>
  );
};

