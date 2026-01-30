import React, { useState, useEffect } from 'react';
import { supabase } from '../../../services/supabase.ts';

interface PlayerPositionSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  playerId: string;
  playerName: string;
  isGoalkeeper: boolean;
  currentPositions: string[] | null;
  onSave: () => void;
}

const POSITIONS = [
  { id: 'Goleiro', name: 'Goleiro', icon: '🧤', color: 'bg-yellow-500' },
  { id: 'Defesa', name: 'Defesa', icon: '🛡️', color: 'bg-blue-500' },
  { id: 'Meio', name: 'Meio-Campo', icon: '⚡', color: 'bg-green-500' },
  { id: 'Ataque', name: 'Ataque', icon: '⚽', color: 'bg-red-500' },
];

export const PlayerPositionSelectorModal: React.FC<PlayerPositionSelectorProps> = ({
  isOpen,
  onClose,
  playerId,
  playerName,
  isGoalkeeper,
  currentPositions,
  onSave
}) => {
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (isGoalkeeper) {
        setSelectedPositions(['Goleiro']);
      } else {
        setSelectedPositions(currentPositions || []);
      }
      setError(null);
    }
  }, [isOpen, currentPositions, isGoalkeeper]);

  const togglePosition = (positionId: string) => {
    if (isGoalkeeper && positionId === 'Goleiro') {
      return;
    }

    setSelectedPositions(prev => {
      if (prev.includes(positionId)) {
        return prev.filter(p => p !== positionId);
      } else {
        if (prev.length >= 2) {
          return [prev[1], positionId];
        }
        return [...prev, positionId];
      }
    });
  };

  const handleSave = async () => {
    if (selectedPositions.length === 0) {
      setError('Selecione pelo menos 1 posição');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { data, error: updateError } = await supabase
        .from('players')
        .update({ positions: selectedPositions })
        .eq('id', playerId)
        .select();

      if (updateError) {
        console.error('Erro ao atualizar posições:', updateError);

        if (updateError.code === '42501' || updateError.message?.includes('policy')) {
          throw new Error('ERRO RLS: Permissão negada. Execute o script de políticas RLS no Supabase.');
        }

        throw updateError;
      }

      if (!data || data.length === 0) {
        throw new Error('UPDATE não aplicou mudanças. Verifique políticas RLS.');
      }

      onSave();
      onClose();
    } catch (err: any) {
      console.error('Erro ao salvar posições:', err);
      setError(err.message || 'Erro ao salvar posições');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[250] animate-in fade-in duration-200">
      <div className="bg-slate-900 rounded-3xl w-full max-w-md border border-slate-800 shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
        <div className="p-6 border-b border-slate-800">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h2 className="text-xl font-black text-white">Suas Posições</h2>
              <p className="text-slate-400 text-sm mt-1">{playerName}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-xl transition-all text-slate-400 hover:text-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
            Escolha 1 ou 2 posições • Impacta no sorteio dos times
          </p>
        </div>

        <div className="p-6 space-y-3">
          {POSITIONS.map(position => {
            const isSelected = selectedPositions.includes(position.id);
            const isDisabled = isGoalkeeper && position.id === 'Goleiro';
            const cannotSelect = !isGoalkeeper && position.id === 'Goleiro';

            return (
              <button
                key={position.id}
                onClick={() => !cannotSelect && togglePosition(position.id)}
                disabled={isDisabled || cannotSelect}
                className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                  isSelected
                    ? `${position.color} border-white/30 text-white shadow-lg`
                    : cannotSelect
                    ? 'bg-slate-800/30 border-slate-700/30 text-slate-600 cursor-not-allowed'
                    : 'bg-slate-800/50 border-slate-700/50 text-slate-300 hover:border-slate-600 hover:bg-slate-800'
                } ${isDisabled ? 'opacity-50' : ''}`}
              >
                <div className={`text-3xl ${isSelected ? 'scale-110' : ''} transition-transform`}>
                  {position.icon}
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-black text-sm uppercase tracking-wide">{position.name}</h3>
                  {isDisabled && (
                    <p className="text-xs opacity-70 mt-0.5">Posição fixa de goleiro</p>
                  )}
                  {cannotSelect && (
                    <p className="text-xs opacity-70 mt-0.5">Apenas para goleiros</p>
                  )}
                </div>
                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {selectedPositions.length > 0 && (
          <div className="px-6 pb-4">
            <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">
                Posições Selecionadas
              </p>
              <div className="flex gap-2">
                {selectedPositions.map(posId => {
                  const pos = POSITIONS.find(p => p.id === posId);
                  return (
                    <span
                      key={posId}
                      className="px-3 py-1 bg-slate-700 text-white rounded-lg text-xs font-black flex items-center gap-1"
                    >
                      <span>{pos?.icon}</span>
                      <span>{pos?.name}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="px-6 pb-4">
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
              <p className="text-red-500 text-xs font-bold text-center">{error}</p>
            </div>
          </div>
        )}

        <div className="p-6 border-t border-slate-800 space-y-2">
          <button
            onClick={handleSave}
            disabled={saving || selectedPositions.length === 0}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded-xl font-black text-sm uppercase transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Salvando...' : 'Salvar Posições'}
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-black text-sm uppercase transition-all"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

