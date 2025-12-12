import React, { useState, useEffect } from 'react';
import { AppSettings, InstallType } from '../types';
import { LABELS } from '../constants';
import { Volume2, VolumeX, Moon, Sun, Save, Share2, Settings as SettingsIcon, DollarSign, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface SettingsViewProps {
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onSave }) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [isSaved, setIsSaved] = useState(false);
  const [apiKeyStatus, setApiKeyStatus] = useState<'checking' | 'ok' | 'missing'>('checking');

  useEffect(() => {
    const key = process.env.API_KEY;
    if (key && key.length > 10) {
      setApiKeyStatus('ok');
    } else {
      setApiKeyStatus('missing');
    }
  }, []);

  const handleChangePrice = (type: InstallType, val: string) => {
    const num = parseFloat(val);
    if (!isNaN(num)) {
      setLocalSettings(prev => ({
        ...prev,
        customPrices: {
          ...prev.customPrices,
          [type]: num
        }
      }));
    }
  };

  const handleSave = () => {
    onSave(localSettings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Netuno Jarvis Tracker',
      text: 'Lleva el control de tus instalaciones de Netuno con IA.',
      url: window.location.origin
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch (err) { console.log('Error sharing', err); }
    } else {
      navigator.clipboard.writeText(window.location.origin);
      alert("Enlace copiado.");
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <header className="flex flex-col gap-2 pb-4">
        <h2 className="text-xl font-bold dark:text-white text-slate-800 tracking-wide flex items-center gap-2">
          <SettingsIcon className="text-cyan-600 dark:text-zinc-400" size={24} />
          CONFIGURACIÓN
        </h2>
        <p className="dark:text-zinc-500 text-slate-500 text-sm">Personaliza tu experiencia.</p>
      </header>

      {/* System Status */}
      <section className="space-y-3">
        <h3 className="text-[10px] font-bold uppercase tracking-widest dark:text-zinc-600 text-slate-400 mb-2">SISTEMA</h3>
        <div className={`flex items-center justify-between p-4 rounded-2xl border shadow-sm glass-panel ${
          apiKeyStatus === 'ok' ? 'border-emerald-500/20' : 'border-red-500/20'
        }`}>
          <div className="flex items-center gap-3">
            {apiKeyStatus === 'ok' ? <CheckCircle className="text-emerald-500" /> : <XCircle className="text-red-500" />}
            <div>
              <span className={`block font-bold text-sm ${apiKeyStatus === 'ok' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600'}`}>IA Gemini</span>
              <span className="text-[10px] dark:text-zinc-500 text-slate-500">{apiKeyStatus === 'ok' ? 'Conectado' : 'Sin API Key'}</span>
            </div>
          </div>
          <div className={`w-2 h-2 rounded-full ${apiKeyStatus === 'ok' ? 'bg-emerald-500' : 'bg-red-500'}`} />
        </div>
      </section>

      {/* General Settings */}
      <section className="space-y-3">
        <h3 className="text-[10px] font-bold uppercase tracking-widest dark:text-zinc-600 text-slate-400 mb-2">PREFERENCIAS</h3>
        
        {/* Theme Toggle */}
        <div className="flex items-center justify-between p-4 glass-panel rounded-2xl">
          <div className="flex items-center gap-3">
            {localSettings.theme === 'dark' ? <Moon className="text-zinc-400" /> : <Sun className="text-amber-500" />}
            <div>
              <span className="block font-bold dark:text-white text-slate-800 text-sm">Modo Oscuro</span>
              <span className="text-[10px] dark:text-zinc-500 text-slate-500">
                {localSettings.theme === 'dark' ? 'Negro Elegante' : 'Azul Cristal'}
              </span>
            </div>
          </div>
          <button 
            onClick={() => setLocalSettings(p => ({ ...p, theme: p.theme === 'dark' ? 'light' : 'dark' }))}
            className={`w-12 h-7 rounded-full p-1 transition-colors ${localSettings.theme === 'dark' ? 'bg-zinc-700' : 'bg-cyan-200'}`}
          >
            <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${localSettings.theme === 'dark' ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>

        {/* TTS Toggle */}
        <div className="flex items-center justify-between p-4 glass-panel rounded-2xl">
          <div className="flex items-center gap-3">
            {localSettings.ttsEnabled ? <Volume2 className="text-emerald-500" /> : <VolumeX className="text-red-400" />}
            <div>
              <span className="block font-bold dark:text-white text-slate-800 text-sm">Voz de Jarvis</span>
              <span className="text-[10px] dark:text-zinc-500 text-slate-500">Lectura de respuestas</span>
            </div>
          </div>
          <button 
            onClick={() => setLocalSettings(p => ({ ...p, ttsEnabled: !p.ttsEnabled }))}
            className={`w-12 h-7 rounded-full p-1 transition-colors ${localSettings.ttsEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-zinc-700'}`}
          >
            <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${localSettings.ttsEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>
      </section>

      {/* Price Settings */}
      <section className="space-y-3">
        <h3 className="text-[10px] font-bold uppercase tracking-widest dark:text-zinc-600 text-slate-400 mb-2">PRECIOS</h3>
        <div className="grid gap-3">
          {Object.values(InstallType).map((type) => (
            <div key={type} className="flex items-center justify-between p-4 glass-panel rounded-2xl">
              <span className="font-bold dark:text-zinc-300 text-slate-700 text-sm">{LABELS[type]}</span>
              <div className="flex items-center gap-1">
                <DollarSign size={14} className="text-slate-400" />
                <input 
                  type="number" 
                  value={localSettings.customPrices[type]}
                  onChange={(e) => handleChangePrice(type, e.target.value)}
                  className="w-16 bg-transparent border-b border-slate-300 dark:border-zinc-700 focus:border-cyan-500 outline-none text-right font-mono font-bold text-lg dark:text-white text-slate-900"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Share Section */}
      <section className="space-y-3">
         <button 
            onClick={handleShare}
            className="w-full py-4 flex items-center justify-center gap-2 glass-panel border-dashed border-slate-300 dark:border-zinc-700 rounded-2xl text-cyan-700 dark:text-zinc-400 hover:bg-cyan-50/50 dark:hover:bg-white/5 transition-colors"
         >
           <Share2 size={18} />
           <span className="font-bold text-sm">Compartir App</span>
         </button>
      </section>

      {/* Save Button */}
      <div className="fixed bottom-24 left-0 right-0 px-4 flex justify-center z-40 pointer-events-none">
        <button 
          onClick={handleSave}
          className={`pointer-events-auto flex items-center gap-2 px-8 py-3 rounded-full font-bold shadow-xl transition-all transform ${
            isSaved 
            ? 'bg-emerald-500 text-white scale-105' 
            : 'bg-black dark:bg-white text-white dark:text-black hover:scale-105'
          }`}
        >
          <Save size={18} />
          {isSaved ? 'GUARDADO' : 'GUARDAR'}
        </button>
      </div>
      
      <div className="h-24"></div>
    </div>
  );
};