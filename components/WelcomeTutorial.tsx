
import React, { useState, useEffect } from 'react';
import { Bot, Wifi, Cpu, CheckCircle, ArrowRight, Binary, User } from 'lucide-react';
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
        <div className="text-xl font-bold tracking-[0.2em] animate-pulse uppercase">Cargando protocolo Jarvis...</div>
        <div className="mt-4 text-[10px] text-cyan-700 font-mono text-center">
          <div className="animate-slideUp" style={{ animationDelay: '0.2s' }}>&gt; IDENTIFICANDO TERMINAL: {settings.profile}... OK</div>
          <div className="animate-slideUp" style={{ animationDelay: '0.8s' }}>&gt; ENCRIPTANDO BASE DE DATOS LOCAL... OK</div>
          <div className="animate-slideUp" style={{ animationDelay: '1.5s' }}>&gt; DESPLEGANDO CAPA DE IA... OK</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-fadeIn">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
      
      <div className="w-full max-w-md bg-black/40 border border-white/10 rounded-3xl p-8 relative overflow-hidden shadow-2xl shadow-cyan-900/20">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>

        <div className="min-h-[300px] flex flex-col items-center text-center">
          
          {step === 0 && (
            <div className="animate-slideUp space-y-6">
              <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-700 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/30">
                <Bot size={40} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2 uppercase tracking-widest">HOLA, {username ? username : 'TECNICO'}</h2>
                <p className="text-slate-400 text-xs uppercase tracking-widest font-bold">Módulo: <span className="text-cyan-400">{roleLabel}</span></p>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-xs text-slate-300 italic">
                "He optimizado mi interfaz para tus necesidades de Netuno. Estoy listo para procesar tus registros de red."
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="animate-slideUp space-y-6">
              <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-purple-700 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-violet-500/30">
                <Wifi size={40} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2 uppercase tracking-widest">TRANSMISIÓN POR VOZ</h2>
                <p className="text-slate-400 text-xs uppercase tracking-widest">Díctame la carga de datos.</p>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-sm text-slate-300">
                {settings.profile === 'TECHNICIAN' ? (
                  <>Comando: <span className="text-violet-400 font-bold italic">"Registra un recableado corporativo hoy."</span></>
                ) : (
                   <>Comando: <span className="text-cyan-400 font-bold italic">"Anota 3 residenciales y un poste."</span></>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-slideUp space-y-6">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-green-700 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
                <Cpu size={40} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2 uppercase tracking-widest">CENTRAL DE ACCESO</h2>
                <p className="text-slate-400 text-xs uppercase tracking-widest">Gestión rápida de nodos.</p>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-sm text-slate-300">
                El panel de la CPU en la parte superior te permite registrar instalaciones con un solo clic.
              </div>
            </div>
          )}

          {step === 3 && (
             <div className="animate-slideUp space-y-6">
               <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-amber-700 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-orange-500/30">
                 <Binary size={40} className="text-white" />
               </div>
               <div>
                 <h2 className="text-2xl font-bold text-white mb-2 uppercase tracking-widest">PAQUETES DE DATOS</h2>
                 <p className="text-slate-400 text-xs uppercase tracking-widest">Historial Dinámico.</p>
               </div>
               <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-sm text-slate-300">
                 Visualiza tu producción como paquetes de datos en tránsito. Minimiza el chat para expandir el análisis.
               </div>
             </div>
          )}

        </div>

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
            className="flex items-center gap-2 px-6 py-3 bg-white text-black hover:bg-cyan-50 font-bold rounded-full transition-all hover:scale-105 active:scale-95 uppercase tracking-widest text-xs"
          >
            {step === 3 ? 'CONECTAR' : 'SIGUIENTE'} 
            {step === 3 ? <CheckCircle size={18} /> : <ArrowRight size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
};
