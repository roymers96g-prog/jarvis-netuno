import React, { useState, useEffect } from 'react';
import { Bot, Mic, LayoutGrid, CheckCircle, ArrowRight } from 'lucide-react';

interface WelcomeTutorialProps {
  onComplete: () => void;
  username?: string;
}

export const WelcomeTutorial: React.FC<WelcomeTutorialProps> = ({ onComplete, username }) => {
  const [step, setStep] = useState(0);
  const [isBooting, setIsBooting] = useState(true);

  // Boot sequence animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsBooting(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const nextStep = () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  if (isBooting) {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center font-rajdhani text-cyan-500">
        <div className="relative w-32 h-32 mb-8">
           <div className="absolute inset-0 border-t-4 border-cyan-500 rounded-full animate-spin"></div>
           <div className="absolute inset-4 border-r-4 border-blue-600 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '2s' }}></div>
           <div className="absolute inset-0 flex items-center justify-center">
             <Bot size={48} className="animate-pulse" />
           </div>
        </div>
        <div className="text-xl font-bold tracking-[0.2em] animate-pulse">INICIALIZANDO JARVIS...</div>
        <div className="mt-2 text-xs text-cyan-700 font-mono">
          <div className="animate-slideUp" style={{ animationDelay: '0.2s' }}>&gt; CARGANDO MÓDULOS DE IA... OK</div>
          <div className="animate-slideUp" style={{ animationDelay: '0.8s' }}>&gt; SINCRONIZANDO PRECIOS... OK</div>
          <div className="animate-slideUp" style={{ animationDelay: '1.5s' }}>&gt; ESTABLECIENDO CONEXIÓN SEGURA... OK</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-fadeIn">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
      
      <div className="w-full max-w-md bg-black/40 border border-white/10 rounded-3xl p-8 relative overflow-hidden shadow-2xl shadow-cyan-900/20">
        {/* Glow effect */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>

        {/* Content based on step */}
        <div className="min-h-[300px] flex flex-col items-center text-center">
          
          {step === 0 && (
            <div className="animate-slideUp space-y-6">
              <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-700 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/30">
                <Bot size={40} className="text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">HOLA, {username ? username.toUpperCase() : 'TÉCNICO'}</h2>
                <p className="text-slate-400">Soy Jarvis, tu asistente personal para el registro de instalaciones.</p>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-sm text-slate-300">
                "Puedo calcular tus ganancias, guardar registros por voz y analizar tu rendimiento semanal."
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="animate-slideUp space-y-6">
              <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-purple-700 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-violet-500/30">
                <Mic size={40} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">CONTROL POR VOZ</h2>
                <p className="text-slate-400">No pierdas tiempo escribiendo.</p>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-sm text-slate-300">
                Presiona el micrófono y di:<br/>
                <span className="text-cyan-400 font-bold italic">"Registra 2 instalaciones residenciales y 1 corporativa con fecha de ayer."</span>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-slideUp space-y-6">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-green-700 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
                <LayoutGrid size={40} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">ACCESO RÁPIDO</h2>
                <p className="text-slate-400">Widgets para registros manuales.</p>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-sm text-slate-300">
                Usa el botón de la cuadrícula en la barra superior para añadir instalaciones con un solo toque.
              </div>
            </div>
          )}

        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8 pt-4 border-t border-white/10">
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <div 
                key={i} 
                className={`w-2 h-2 rounded-full transition-all ${step === i ? 'bg-cyan-500 w-6' : 'bg-slate-600'}`}
              />
            ))}
          </div>
          
          <button 
            onClick={nextStep}
            className="flex items-center gap-2 px-6 py-3 bg-white text-black hover:bg-cyan-50 font-bold rounded-full transition-all hover:scale-105 active:scale-95"
          >
            {step === 2 ? 'COMENZAR' : 'SIGUIENTE'} 
            {step === 2 ? <CheckCircle size={18} /> : <ArrowRight size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
};