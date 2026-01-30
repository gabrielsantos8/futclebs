import React from 'react';
import { Player } from '../../../services/supabase.ts';

interface AvatarModalProps {
  avatar: any;
  userProfile: Player;
  onClose: () => void;
  onSave: () => void;
  onRemove: () => void;
}

export const AvatarModal: React.FC<AvatarModalProps> = ({
  avatar,
  userProfile,
  onClose,
  onSave,
  onRemove
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

      <div
        className="relative w-full max-w-md rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-950 to-emerald-950/40" />

        <div className="relative p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Personalização</p>
              <h2 className="text-white font-black text-lg">Editar Avatar</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-slate-300 font-bold text-xs">Cortar imagem</p>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  1:1
                </span>
              </div>

              <div
                ref={avatar.cropBoxRef}
                className={`relative w-full aspect-square rounded-2xl overflow-hidden border border-white/10 bg-slate-950 select-none ${
                  avatar.avatarSrc ? 'cursor-grab active:cursor-grabbing' : ''
                }`}
                onPointerDown={avatar.onPointerDown}
                onPointerMove={avatar.onPointerMove}
                onPointerUp={avatar.onPointerUp}
                onPointerCancel={avatar.onPointerUp}
                onPointerLeave={avatar.onPointerUp}
              >
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-0 opacity-40">
                    <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/10" />
                    <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/10" />
                    <div className="absolute top-1/3 left-0 right-0 h-px bg-white/10" />
                    <div className="absolute top-2/3 left-0 right-0 h-px bg-white/10" />
                  </div>

                  <div className="absolute inset-0 ring-1 ring-white/15 rounded-2xl" />
                  <div className="absolute inset-0 shadow-[inset_0_0_0_9999px_rgba(0,0,0,0.15)]" />
                </div>

                {avatar.avatarSrc ? (
                  <img
                    src={avatar.avatarSrc}
                    alt="Crop"
                    draggable={false}
                    className="absolute top-1/2 left-1/2 will-change-transform"
                    style={{
                      transform: `translate(calc(-50% + ${avatar.cropX}px), calc(-50% + ${avatar.cropY}px)) scale(${avatar.zoom})`,
                      transformOrigin: 'center',
                      minWidth: '100%',
                      minHeight: '100%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-center p-6">
                    <div className="space-y-2">
                      <div className="mx-auto w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                        <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <p className="text-slate-200 font-black text-sm">Selecione uma foto</p>
                      <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                        Arraste para posicionar • Zoom para ajustar
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Zoom</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                    {avatar.zoom.toFixed(2)}x
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.01}
                  value={avatar.zoom}
                  onChange={(e) => avatar.setZoom(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                  disabled={!avatar.avatarSrc}
                />
              </div>

              <p className="mt-3 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                Dica: segure e arraste para mover
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label className="block">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => avatar.selectFile(e.target.files?.[0] || null)}
                />
                <div className="w-full px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-black uppercase tracking-widest text-center cursor-pointer transition-all">
                  Selecionar Foto
                </div>
              </label>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={!avatar.avatarSrc || avatar.uploading}
                  onClick={onSave}
                  className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-950 font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-600/20 active:scale-[0.99]"
                >
                  {avatar.uploading ? 'Salvando...' : 'Salvar Avatar'}
                </button>

                <button
                  type="button"
                  disabled={avatar.uploading || !userProfile?.avatar}
                  onClick={onRemove}
                  className="px-4 py-3 rounded-2xl bg-white/5 hover:bg-red-500/15 border border-white/10 hover:border-red-500/30 text-red-300 hover:text-red-200 disabled:opacity-50 font-black text-xs uppercase tracking-widest transition-all"
                >
                  Remover
                </button>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">AVATAR SUPREMO</p>
                <p className="text-[10px] text-slate-500 font-medium mt-1">
                  Escolha seu avatar para farmar aura.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

