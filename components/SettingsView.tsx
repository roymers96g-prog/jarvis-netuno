import React, { useState } from 'react';
import { AppSettings, InstallType } from '../types';
import { LABELS } from '../constants';
import { Volume2, VolumeX, Moon, Sun, Save, Share2, Settings as SettingsIcon, DollarSign, AlertTriangle } from 'lucide-react';

interface SettingsViewProps {
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onSave }) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [isSaved, setIsSaved] = useState(false);

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
    // Check for private/dev environments common in cloud IDEs
    const hostname = window.location.hostname;
    const isPrivateEnv = hostname.includes('localhost') || 
                         hostname.includes('127.0.0.1') || 
                         hostname.includes('usercontent.goog') || 
                         hostname.includes('webcontainer.io') ||
                         hostname.includes('idx.google');

    if (isPrivateEnv) {
      const proceed = window.confirm(
        "⚠️ ADVERTENCIA DE ENLACE PRIVADO ⚠️\n\n" +
        "Parece que estás usando un enlace de desarrollo (" + hostname + ").\n\n" +
        "Este enlace suele ser privado y tus amigos verán un ERROR 404 si intentan entrar.\n\n" +
        "¿Quieres compartirlo de todas formas? (Recomendamos publicar/desplegar la app primero)"
      );
      if (!proceed) return;
    }

    const shareData = {
      title: 'Netuno Jarvis Tracker',
      text: 'Lleva el control de tus instalaciones de Netuno con IA.',
      url: window.location.origin
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Error sharing', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.origin);
      alert("Enlace copiado al portapapeles. (Recuerda: Si es un enlace de prueba, puede no funcionar para otros).");
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn text-slate-200 dark:text-slate-200 text-slate-800">
      <header className="flex flex-col gap-2 border-b border-slate-700 dark:border-slate-700 border-slate-200 pb-4">
        <h2 className="text-xl font-bold dark:text-white text-slate-900 tracking-wide flex items-center gap-2">
          <SettingsIcon className="text-cyan-400" size={24} />
          CONFIGURACIÓN
        </h2>
        <p className="dark:text-slate-400 text-slate-600 text-sm">Personaliza tu asistente Jarvis.</p>
      </header>

      {/* General Settings */}
      <section className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-widest dark:text-slate-500 text-slate-500 mb-2">GENERAL</h3>
        
        {/* Theme Toggle */}
        <div className="flex items-center justify-between p-4 dark:bg-slate-800 bg-white rounded-xl border dark:border-slate-700 border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            {localSettings.theme === 'dark' ? <Moon className="text-violet-400" /> : <Sun className="text-amber-500" />}
            <div>
              <span className="block font-bold dark:text-white text-slate-900">Tema Visual</span>
              <span className="text-xs dark:text-slate-400 text-slate-500">
                {localSettings.theme === 'dark' ? 'Modo Oscuro (Jarvis)' : 'Modo Claro'}
              </span>
            </div>
          </div>
          <button 
            onClick={() => setLocalSettings(p => ({ ...p, theme: p.theme === 'dark' ? 'light' : 'dark' }))}
            className={`w-12 h-6 rounded-full p-1 transition-colors ${localSettings.theme === 'dark' ? 'bg-cyan-600' : 'bg-slate-300'}`}
          >
            <div className={`w-4 h-4 rounded-full bg-white shadow transform transition-transform ${localSettings.theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>

        {/* TTS Toggle */}
        <div className="flex items-center justify-between p-4 dark:bg-slate-800 bg-white rounded-xl border dark:border-slate-700 border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            {localSettings.ttsEnabled ? <Volume2 className="text-emerald-400" /> : <VolumeX className="text-red-400" />}
            <div>
              <span className="block font-bold dark:text-white text-slate-900">Respuesta de Voz</span>
              <span className="text-xs dark:text-slate-400 text-slate-500">Jarvis leerá sus respuestas en voz alta</span>
            </div>
          </div>
          <button 
            onClick={() => setLocalSettings(p => ({ ...p, ttsEnabled: !p.ttsEnabled }))}
            className={`w-12 h-6 rounded-full p-1 transition-colors ${localSettings.ttsEnabled ? 'bg-emerald-500' : 'bg-slate-600'}`}
          >
            <div className={`w-4 h-4 rounded-full bg-white shadow transform transition-transform ${localSettings.ttsEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>
      </section>

      {/* Price Settings */}
      <section className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-widest dark:text-slate-500 text-slate-500 mb-2">TABULADOR DE PRECIOS</h3>
        <div className="grid gap-3">
          {Object.values(InstallType).map((type) => (
            <div key={type} className="flex items-center justify-between p-4 dark:bg-slate-800 bg-white rounded-xl border dark:border-slate-700 border-slate-200">
              <span className="font-bold dark:text-slate-300 text-slate-700">{LABELS[type]}</span>
              <div className="flex items-center gap-2">
                <DollarSign size={16} className="text-cyan-500" />
                <input 
                  type="number" 
                  value={localSettings.customPrices[type]}
                  onChange={(e) => handleChangePrice(type, e.target.value)}
                  className="w-20 bg-transparent border-b border-slate-500 focus:border-cyan-400 outline-none text-right font-mono font-bold text-lg dark:text-white text-slate-900"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Share Section */}
      <section className="space-y-4">
         <h3 className="text-sm font-bold uppercase tracking-widest dark:text-slate-500 text-slate-500 mb-2">COMPARTIR APP</h3>
         <button 
            onClick={handleShare}
            className="w-full py-4 flex items-center justify-center gap-2 dark:bg-slate-800 bg-white border border-dashed dark:border-slate-600 border-slate-300 rounded-xl dark:text-cyan-400 text-cyan-600 hover:bg-cyan-500/5 transition-colors"
         >
           <Share2 size={20} />
           <span className="font-bold">Compartir con amigos</span>
         </button>
         <p className="text-xs text-center dark:text-slate-500 text-slate-500 px-4">
           Al compartir el enlace, tus amigos abrirán su propia versión de la app. Sus datos se guardarán únicamente en sus teléfonos.
         </p>
         
         {/* Helper Text for Dev Envs */}
         {(window.location.hostname.includes('google') || window.location.hostname.includes('webcontainer')) && (
            <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <AlertTriangle className="text-yellow-500 shrink-0" size={16} />
              <p className="text-xs text-yellow-500/90 text-left">
                <strong>Nota:</strong> Si estás viendo este mensaje, estás en un entorno de desarrollo. Recuerda que para que el enlace funcione para todos, debes publicar tu app (Deploy).
              </p>
            </div>
         )}
      </section>

      {/* Save Button */}
      <div className="fixed bottom-24 left-0 right-0 px-4 flex justify-center z-40 pointer-events-none">
        <button 
          onClick={handleSave}
          className={`pointer-events-auto flex items-center gap-2 px-8 py-3 rounded-full font-bold shadow-xl transition-all transform ${
            isSaved 
            ? 'bg-emerald-500 text-white scale-105' 
            : 'bg-cyan-600 text-white hover:bg-cyan-500 hover:scale-105'
          }`}
        >
          <Save size={20} />
          {isSaved ? 'GUARDADO' : 'GUARDAR CAMBIOS'}
        </button>
      </div>
      
      {/* Spacer for bottom bar */}
      <div className="h-24"></div>
    </div>
  );
};