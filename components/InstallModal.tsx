import React from 'react';
import { Download, MoreVertical, Share, PlusSquare, X } from 'lucide-react';

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isIOS: boolean;
}

export const InstallModal: React.FC<InstallModalProps> = ({ isOpen, onClose, isIOS }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md animate-fadeIn" onClick={onClose}>
      <div className="w-full max-w-sm glass-panel border dark:border-cyan-500/30 border-white/50 rounded-3xl p-6 shadow-2xl animate-scaleIn relative" onClick={e => e.stopPropagation()}>
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X size={24} />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/20">
            <Download size={32} className="text-white" />
          </div>

          <h3 className="text-xl font-bold dark:text-white text-slate-800 mb-2">INSTALAR APP</h3>
          
          <p className="text-sm text-slate-500 dark:text-zinc-400 mb-6 leading-relaxed">
            Esta aplicación se instala directamente desde tu navegador. Sigue estos pasos:
          </p>

          <div className="w-full bg-slate-100 dark:bg-black/40 rounded-xl p-4 text-left space-y-4 border border-slate-200 dark:border-white/10">
            {isIOS ? (
              // iOS Instructions
              <>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-200 dark:bg-zinc-800 rounded-lg">
                    <Share size={20} className="text-blue-500" />
                  </div>
                  <span className="text-sm dark:text-zinc-300 text-slate-700">1. Toca el botón <b>Compartir</b> en la barra inferior.</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-200 dark:bg-zinc-800 rounded-lg">
                    <PlusSquare size={20} className="text-slate-600 dark:text-slate-300" />
                  </div>
                  <span className="text-sm dark:text-zinc-300 text-slate-700">2. Busca y selecciona <b>"Agregar al inicio"</b>.</span>
                </div>
              </>
            ) : (
              // Android / Chrome Instructions
              <>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-200 dark:bg-zinc-800 rounded-lg">
                    <MoreVertical size={20} className="text-slate-600 dark:text-slate-300" />
                  </div>
                  <span className="text-sm dark:text-zinc-300 text-slate-700">1. Toca los <b>3 puntos</b> en la esquina superior derecha del navegador.</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-200 dark:bg-zinc-800 rounded-lg">
                    <Download size={20} className="text-cyan-600" />
                  </div>
                  <span className="text-sm dark:text-zinc-300 text-slate-700">2. Selecciona <b>"Instalar aplicación"</b> o <b>"Agregar a la pantalla principal"</b>.</span>
                </div>
              </>
            )}
          </div>

          <button 
            onClick={onClose}
            className="mt-6 w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold tracking-wide transition-colors"
          >
            ENTENDIDO
          </button>
        </div>
      </div>
    </div>
  );
};