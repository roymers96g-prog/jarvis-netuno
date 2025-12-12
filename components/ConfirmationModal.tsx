import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
      <div className="w-full max-w-sm bg-slate-800 border border-red-500/30 rounded-2xl p-6 shadow-2xl animate-slideUp shadow-red-900/20" onClick={e => e.stopPropagation()}>
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
            <AlertTriangle size={32} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2 tracking-wide uppercase">{title}</h3>
          <p className="text-slate-400 text-sm leading-relaxed">{message}</p>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-3 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors font-semibold tracking-wider text-sm"
          >
            CANCELAR
          </button>
          <button 
            onClick={onConfirm}
            className="px-4 py-3 rounded-lg bg-red-600 text-white hover:bg-red-500 shadow-lg shadow-red-600/20 transition-colors font-bold tracking-wider text-sm flex items-center justify-center gap-2"
          >
             ELIMINAR
          </button>
        </div>
      </div>
    </div>
  );
};