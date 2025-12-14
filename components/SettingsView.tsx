import React, { useState, useEffect, useRef } from 'react';
import { AppSettings, InstallType } from '../types';
import { LABELS } from '../constants';
import { exportBackupData, importBackupData } from '../services/storageService';
import { validateApiKey } from '../services/geminiService';
// FIX: Import `getEffectiveApiKey` to resolve "Cannot find name" error.
import { getEffectiveApiKey } from '../services/settingsService';
import { Volume2, VolumeX, Moon, Sun, Save, Share2, Settings as SettingsIcon, DollarSign, CheckCircle, XCircle, Download, Upload, User, Mic, Play, Key, Activity, Loader2, Target } from 'lucide-react';

interface SettingsViewProps {
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onSave }) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [isSaved, setIsSaved] = useState(false);
  const [apiKeyStatus, setApiKeyStatus] = useState<'checking' | 'ok' | 'missing' | 'validating'>('checking');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check input validity visually
  useEffect(() => {
    const key = localSettings.apiKey?.trim() || getEffectiveApiKey();
    if (key && key.length > 20) {
      if (apiKeyStatus !== 'validating') setApiKeyStatus('ok');
    } else {
      setApiKeyStatus('missing');
    }
  }, [localSettings.apiKey]);

  useEffect(() => {
    // Load voices
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      const spanishVoices = voices.filter(v => v.lang.startsWith('es'));
      setAvailableVoices(spanishVoices.length > 0 ? spanishVoices : voices);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
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

  const handleTestApiKey = async () => {
    const key = localSettings.apiKey?.trim();
    if (!key) return;

    setApiKeyStatus('validating');
    onSave(localSettings); // Save first so service can use it
    
    const isValid = await validateApiKey(key);
    if (isValid) {
      setApiKeyStatus('ok');
      alert("✅ ¡Conexión Exitosa! La API Key funciona correctamente.");
    } else {
      setApiKeyStatus('missing');
      alert("❌ Error: La API Key no funciona. Verifica que la copiaste correctamente.");
    }
  };

  const handleTestVoice = () => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance("Hola señor. Los sistemas están operando al cien por ciento.");
    utterance.lang = 'es-ES';
    utterance.pitch = localSettings.voiceSettings.pitch;
    utterance.rate = localSettings.voiceSettings.rate;
    
    if (localSettings.voiceSettings.voiceURI) {
      const selectedVoice = availableVoices.find(v => v.voiceURI === localSettings.voiceSettings.voiceURI);
      if (selectedVoice) utterance.voice = selectedVoice;
    }
    
    window.speechSynthesis.speak(utterance);
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

  const handleExport = () => {
    const dataStr = exportBackupData();
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `netuno_backup_${new Date().toISOString().slice(0,10)}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        const success = importBackupData(content);
        if (success) {
          alert('¡Copia de seguridad restaurada correctamente! La página se recargará.');
          window.location.reload();
        } else {
          alert('Error: El archivo no es válido.');
        }
      }
    };
    reader.readAsText(file);
    event.target.value = '';
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

      {/* System Status & API Key */}
      <section className="space-y-3">
        <h3 className="text-[10px] font-bold uppercase tracking-widest dark:text-zinc-600 text-slate-400 mb-2">CONEXIÓN IA</h3>
        
        <div className={`flex flex-col p-4 rounded-2xl border shadow-sm glass-panel transition-colors ${
          apiKeyStatus === 'ok' ? 'border-emerald-500/20' : 'border-red-500/20'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {apiKeyStatus === 'validating' ? (
                 <Loader2 className="animate-spin text-cyan-500" />
              ) : apiKeyStatus === 'ok' ? (
                 <CheckCircle className="text-emerald-500" /> 
              ) : (
                 <XCircle className="text-red-500" />
              )}
              <div>
                <span className={`block font-bold text-sm ${apiKeyStatus === 'ok' ? 'text-emerald-600 dark:text-emerald-400' : apiKeyStatus === 'validating' ? 'text-cyan-500' : 'text-red-600'}`}>
                  IA Gemini
                </span>
                <span className="text-[10px] dark:text-zinc-500 text-slate-500">
                  {apiKeyStatus === 'ok' ? 'Listo para usar' : apiKeyStatus === 'validating' ? 'Verificando...' : 'Sin conexión'}
                </span>
              </div>
            </div>
            <div className={`w-2 h-2 rounded-full ${apiKeyStatus === 'ok' ? 'bg-emerald-500' : 'bg-red-500'}`} />
          </div>

          <div className="bg-slate-50 dark:bg-black/20 rounded-xl p-3 mb-3">
            <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 mb-2 block flex items-center gap-2">
              <Key size={12} /> Google Gemini API Key
            </label>
            <input 
              type="password"
              value={localSettings.apiKey}
              onChange={(e) => setLocalSettings(p => ({ ...p, apiKey: e.target.value }))}
              placeholder="Pega tu llave aquí..."
              className="w-full bg-transparent border-b border-slate-300 dark:border-zinc-700 focus:border-cyan-500 outline-none text-sm dark:text-white text-slate-900 pb-2 placeholder:text-slate-400 font-mono"
            />
          </div>

          <button 
            onClick={handleTestApiKey}
            disabled={!localSettings.apiKey || apiKeyStatus === 'validating'}
            className="w-full py-2 bg-slate-900 dark:bg-white text-white dark:text-black rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {apiKeyStatus === 'validating' ? <Loader2 size={14} className="animate-spin" /> : <Activity size={14} />}
            PROBAR Y GUARDAR LLAVE
          </button>
        </div>
      </section>

      {/* Profile Section */}
      <section className="space-y-3">
        <h3 className="text-[10px] font-bold uppercase tracking-widest dark:text-zinc-600 text-slate-400 mb-2">PERFIL</h3>
        <div className="flex items-center justify-between p-4 glass-panel rounded-2xl">
          <div className="flex items-center gap-3">
            <User className="text-cyan-600 dark:text-zinc-400" />
            <div>
              <span className="block font-bold dark:text-white text-slate-800 text-sm">Nombre de Usuario</span>
              <span className="text-[10px] dark:text-zinc-500 text-slate-500">
                Así te llamará Jarvis
              </span>
            </div>
          </div>
          <input 
             type="text"
             value={localSettings.nickname}
             onChange={(e) => setLocalSettings(p => ({ ...p, nickname: e.target.value }))}
             placeholder="Técnico"
             className="w-32 bg-transparent border-b border-slate-300 dark:border-zinc-700 focus:border-cyan-500 outline-none text-right font-medium text-sm dark:text-white text-slate-900"
          />
        </div>
      </section>
      
      {/* Goal Section */}
      <section className="space-y-3">
        <h3 className="text-[10px] font-bold uppercase tracking-widest dark:text-zinc-600 text-slate-400 mb-2">METAS DE PRODUCCIÓN</h3>
        <div className="flex items-center justify-between p-4 glass-panel rounded-2xl">
          <div className="flex items-center gap-3">
            <Target className="text-emerald-500 dark:text-emerald-400" />
            <div>
              <span className="block font-bold dark:text-white text-slate-800 text-sm">Meta Mensual</span>
              <span className="text-[10px] dark:text-zinc-500 text-slate-500">
                Tu objetivo de ingresos
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <DollarSign size={14} className="text-slate-400" />
            <input 
               type="number"
               value={localSettings.monthlyGoal > 0 ? localSettings.monthlyGoal : ''}
               onChange={(e) => setLocalSettings(p => ({ ...p, monthlyGoal: parseFloat(e.target.value) || 0 }))}
               placeholder="0"
               className="w-24 bg-transparent border-b border-slate-300 dark:border-zinc-700 focus:border-cyan-500 outline-none text-right font-medium text-lg dark:text-white text-slate-900"
            />
          </div>
        </div>
      </section>

      {/* Voice Settings Section */}
      <section className="space-y-3">
        <h3 className="text-[10px] font-bold uppercase tracking-widest dark:text-zinc-600 text-slate-400 mb-2">SINTETIZADOR DE VOZ</h3>
        <div className="glass-panel p-4 rounded-2xl space-y-4">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mic className="text-cyan-500" />
                <div>
                  <span className="block font-bold dark:text-white text-slate-800 text-sm">Voz de Jarvis</span>
                  <span className="text-[10px] dark:text-zinc-500 text-slate-500">Selecciona la voz más parecida</span>
                </div>
              </div>
              <button 
                onClick={() => setLocalSettings(p => ({ ...p, ttsEnabled: !p.ttsEnabled }))}
                className={`w-12 h-7 rounded-full p-1 transition-colors ${localSettings.ttsEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-zinc-700'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${localSettings.ttsEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
           </div>

           {localSettings.ttsEnabled && (
             <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-zinc-700">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-zinc-400">Selección de Voz</label>
                  <select 
                    value={localSettings.voiceSettings.voiceURI}
                    onChange={(e) => setLocalSettings(p => ({ ...p, voiceSettings: { ...p.voiceSettings, voiceURI: e.target.value } }))}
                    className="w-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg p-2 text-sm dark:text-white"
                  >
                    <option value="">Automático (Recomendado)</option>
                    {availableVoices.map(v => (
                      <option key={v.voiceURI} value={v.voiceURI}>
                        {v.name} ({v.lang})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-zinc-400">Tono (Pitch): {localSettings.voiceSettings.pitch}</label>
                    <input 
                      type="range" min="0.5" max="2" step="0.1"
                      value={localSettings.voiceSettings.pitch}
                      onChange={(e) => setLocalSettings(p => ({ ...p, voiceSettings: { ...p.voiceSettings, pitch: parseFloat(e.target.value) } }))}
                      className="w-full accent-cyan-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-zinc-400">Velocidad: {localSettings.voiceSettings.rate}</label>
                    <input 
                      type="range" min="0.5" max="2" step="0.1"
                      value={localSettings.voiceSettings.rate}
                      onChange={(e) => setLocalSettings(p => ({ ...p, voiceSettings: { ...p.voiceSettings, rate: parseFloat(e.target.value) } }))}
                      className="w-full accent-cyan-500"
                    />
                  </div>
                </div>

                <button 
                  onClick={handleTestVoice}
                  className="w-full py-2 bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 rounded-lg flex items-center justify-center gap-2 text-xs font-bold transition-colors text-slate-700 dark:text-zinc-300"
                >
                  <Play size={14} /> PROBAR VOZ
                </button>
             </div>
           )}
        </div>
      </section>

      {/* Preferences Section */}
      <section className="space-y-3">
        <h3 className="text-[10px] font-bold uppercase tracking-widest dark:text-zinc-600 text-slate-400 mb-2">PREFERENCIAS VISUALES</h3>
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
      </section>

      {/* Backup Section */}
      <section className="space-y-3">
        <h3 className="text-[10px] font-bold uppercase tracking-widest dark:text-zinc-600 text-slate-400 mb-2">SEGURIDAD DE DATOS</h3>
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={handleExport}
            className="flex flex-col items-center justify-center gap-2 p-4 glass-panel rounded-2xl hover:bg-emerald-50/10 transition-colors group"
          >
            <Download size={24} className="text-emerald-500 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold dark:text-zinc-300 text-slate-600">Exportar Datos</span>
          </button>

          <button 
            onClick={handleImportClick}
            className="flex flex-col items-center justify-center gap-2 p-4 glass-panel rounded-2xl hover:bg-blue-50/10 transition-colors group"
          >
            <Upload size={24} className="text-blue-500 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold dark:text-zinc-300 text-slate-600">Restaurar Copia</span>
          </button>
          
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden" 
          />
        </div>
        <p className="text-[10px] text-center text-slate-400 dark:text-zinc-600 px-4">
          Descarga un archivo .JSON para guardar tus registros o cárgalo en otro dispositivo.
        </p>
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
          {isSaved ? 'GUARDADO' : 'GUARDAR TODO'}
        </button>
      </div>
      
      <div className="h-24"></div>
    </div>
  );
};