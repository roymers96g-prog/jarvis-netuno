
import React, { useState, useEffect } from 'react';
import { Bot, Mic, LayoutGrid, CheckCircle, ArrowRight, Maximize2, User } from 'lucide-react';
import { getSettings } from '../services/settingsService';

interface WelcomeTutorialProps {
  onComplete: () => void;
  username?: string;
}

export const WelcomeTutorial: React.FC<WelcomeTutorialProps> = ({ onComplete, username }) => {
  const [step, setStep] = useState(0);
  const [isBooting, setIsBooting] = useState(true);
  const settings = getSettings();
  const roleLabel = settings.profile === 'TECHNICIAN' ? 'TÉCNICO DE SERVICIOS' : 'INSTALADOR DE FIBRA';

  // Boot sequence animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsBooting(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const nextStep = () => {
    if (step < 3) {
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
          <div className="animate-slideUp" style={{ animationDelay: '0.2s' }}>&gt; CARGANDO PERFIL: {settings.profile}... OK</div>
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
                <h2 className="text-2xl font-bold text-white mb-2">HOLA, {username ? username.toUpperCase() : 'USUARIO'}</h2>
                <p className="text-slate-400">Perfil Activado: <span className="text-cyan-400 font-bold">{roleLabel}</span></p>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-sm text-slate-300">
                "Soy Jarvis, tu asistente. He configurado mi sistema para registrar específicamente tus {settings.profile === 'TECHNICIAN' ? 'servicios de soporte y recableado' : 'instalaciones residenciales y corporativas'}."
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
                <p className="text-slate-400">Díctame tu producción diaria.</p>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-sm text-slate-300">
                {settings.profile === 'TECHNICIAN' ? (
                  <>Ejemplo: <span className="text-violet-400 font-bold italic">"Registra 1 servicio básico y 1 recableado con fecha de ayer."</span></>
                ) : (
                   <>Ejemplo: <span className="text-cyan-400 font-bold italic">"Registra 2 residenciales y 1 poste hoy."</span></>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-slideUp space-y-6">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-green-700 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
                <LayoutGrid size={40} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">WIDGET RÁPIDO</h2>
                <p className="text-slate-400">Registra con un solo toque.</p>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-sm text-slate-300">
                El botón de la cuadrícula superior abre tu menú personalizado con los tipos de {settings.profile === 'TECHNICIAN' ? 'servicios técnicos' : 'instalaciones'} que seleccionaste.
              </div>
            </div>
          )}

          {step === 3 && (
             <div className="animate-slideUp space-y-6">
               <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-amber-700 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-orange-500/30">
                 <Maximize2 size={40} className="text-white" />
               </div>
               <div>
                 <h2 className="text-2xl font-bold text-white mb-2">CHAT DINÁMICO</h2>
                 <p className="text-slate-400">Nueva funcionalidad.</p>
               </div>
               <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-sm text-slate-300">
                 Ahora puedes <b>minimizar, expandir o cerrar</b> la ventana de chat para ver mejor tus gráficos sin que estorbe en la pantalla.
               </div>
             </div>
          )}

        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8 pt-4 border-t border-white/10">
          <div className="flex gap-2">
            {[0, 1, 2, 3].map((i) => (
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
            {step === 3 ? 'COMENZAR' : 'SIGUIENTE'} 
            {step === 3 ? <CheckCircle size={18} /> : <ArrowRight size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
};
