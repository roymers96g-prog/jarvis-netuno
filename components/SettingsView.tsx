
import React, { useState, useEffect, useRef } from 'react';
import { AppSettings, InstallType, UserProfile } from '../types';
import { LABELS } from '../constants';
import { exportBackupData, importBackupData, generateCSV, wipeUserData } from '../services/storageService';
import { validateApiKey } from '../services/geminiService';
import { getEffectiveApiKey } from '../services/settingsService';
import { ConfirmationModal } from './ConfirmationModal';
import { Moon, Sun, Save, Settings as SettingsIcon, DollarSign, CheckCircle, XCircle, Download, Upload, User, Mic, Play, Key, Activity, Loader2, Target, FileSpreadsheet, HardHat, Cpu, Trash2, AlertTriangle, Eye, EyeOff, Plus, Minus, Zap, Globe, ShieldCheck, SunMedium } from 'lucide-react';

interface SettingsViewProps {
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onSave }) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [isSaved, setIsSaved] = useState(false);
  const [apiKeyStatus, setApiKeyStatus] = useState<'checking' | 'ok' | 'missing' | 'validating'>('checking');
  const [apiErrorMsg, setApiErrorMsg] = useState<string>('');
  const [showApiKey, setShowApiKey] = useState(false); 
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [showWipeModal, setShowWipeModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const key = localSettings.apiKey?.trim() || getEffectiveApiKey();
    if (key && key.length > 20) {
      if (apiKeyStatus !== 'validating' && apiKeyStatus !== 'ok' && !apiErrorMsg) setApiKeyStatus('checking'); 
    } else {
      setApiKeyStatus('missing');
    }
  }, [localSettings.apiKey]);

  useEffect(() => {
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
    setLocalSettings(prev => ({
      ...prev,
      customPrices: {
        ...prev.customPrices,
        [type]: isNaN(num) ? 0 : num
      }
    }));
  };

  const adjustPrice = (type: InstallType, delta: number) => {
    setLocalSettings(prev => {
      const current = prev.customPrices[type] || 0;
      const newVal = Math.max(0, current + delta);
      return {
        ...prev,
        customPrices: {
          ...prev.customPrices,
          [type]: newVal
        }
      };
    });
  };

  const cleanApiKey = (key: string) => {
    return key ? key.trim().replace(/[\r\n\s\u200B-\u200D\uFEFF]/g, '') : '';
  };

  const handleSave = () => {
    const cleanSettings = {
        ...localSettings,
        apiKey: cleanApiKey(localSettings.apiKey)
    };
    onSave(cleanSettings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleTestApiKey = async () => {
    const rawKey = localSettings.apiKey || "";
    const key = cleanApiKey(rawKey);
    
    if (key !== rawKey) {
        setLocalSettings(p => ({ ...p, apiKey: key }));
    }

    if (!key) {
      alert("Por favor ingresa una API Key primero.");
      return;
    }

    setApiKeyStatus('validating');
    setApiErrorMsg('');
    
    onSave({ ...localSettings, apiKey: key }); 
    
    const result = await validateApiKey(key);
    
    if (result.valid) {
      setApiKeyStatus('ok');
      setApiErrorMsg('');
      alert("✅ Conexión establecida con el núcleo de IA.");
    } else {
      setApiKeyStatus('missing');
      setApiErrorMsg(result.error || "Error de red");
      alert(result.error || "Error al conectar con la infraestructura de IA");
    }
  };

  const handleTestVoice = () => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance("Sistemas calibrados. Listo para la siguiente fase de producción.");
    utterance.lang = 'es-ES';
    utterance.pitch = localSettings.voiceSettings.pitch;
    utterance.rate = localSettings.voiceSettings.rate;
    
    if (localSettings.voiceSettings.voiceURI) {
      const selectedVoice = availableVoices.find(v => v.voiceURI === localSettings.voiceSettings.voiceURI);
      if (selectedVoice) utterance.voice = selectedVoice;
    }
    
    window.speechSynthesis.speak(utterance);
  };

  const handleExportJSON = () => {
    const dataStr = exportBackupData();
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `netuno_backup_${new Date().toISOString().slice(0,10)}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleExportCSV = () => {
    const csvContent = generateCSV();
    if (!csvContent) {
      alert("No hay registros disponibles.");
      return;
    }
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `reporte_netuno_${new Date().toISOString().slice(0,10)}.csv`);
    link.click();
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
          alert('Datos restaurados correctamente. Reiniciando terminal...');
          window.location.reload();
        } else {
          alert('Error: Archivo de datos corrupto o no válido.');
        }
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleWipeData = async () => {
    await wipeUserData();
    setShowWipeModal(false);
    window.location.reload();
  };

  const installerTypes = [InstallType.RESIDENTIAL, InstallType.CORPORATE, InstallType.POSTE, InstallType.SERVICE];
  const technicianTypes = [
    InstallType.SERVICE_BASIC, 
    InstallType.SERVICE_CORP, 
    InstallType.SERVICE_REWIRING,
    InstallType.SERVICE_REWIRING_CORP,
    InstallType.SERVICE_REWIRING_PPAL,
    InstallType.SERVICE_REWIRING_AYUDANTE,
    InstallType.SERVICE_RELOCATION
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      <header className="flex flex-col gap-2 pb-4">
        <h2 className="text-xl font-bold dark:text-white text-slate-800 tracking-wide flex items-center gap-2">
          <SettingsIcon className="text-cyan-600 dark:text-zinc-400" size={24} />
          NÚCLEO DE CONTROL
        </h2>
        <p className="dark:text-zinc-500 text-slate-500 text-sm uppercase tracking-widest font-bold">Ajustes de Terminal</p>
      </header>

      <section className="space-y-3">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] dark:text-zinc-600 text-slate-400 mb-2">Preferencias de Campo</h3>
        
        {/* Recomendación 5: Modo Alta Visibilidad */}
        <div className="flex items-center justify-between p-4 glass-panel rounded-2xl border border-white/5">
          <div className="flex items-center gap-3">
            <SunMedium className={localSettings.highContrast ? 'text-yellow-500' : 'text-slate-400'} />
            <div>
              <span className="block font-bold dark:text-white text-slate-800 text-sm uppercase tracking-widest">Modo Exteriores</span>
              <span className="text-[10px] dark:text-zinc-500 text-slate-500 uppercase font-bold">Alta Visibilidad / Contraste</span>
            </div>
          </div>
          <button 
            onClick={() => setLocalSettings(p => ({ ...p, highContrast: !p.highContrast }))}
            className={`w-12 h-7 rounded-full p-1 transition-colors ${localSettings.highContrast ? 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]' : 'bg-slate-300 dark:bg-zinc-700'}`}
          >
            <div className={`w-5 h-5 rounded-full bg-white transform transition-transform ${localSettings.highContrast ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>

        <div className="flex items-center justify-between p-4 glass-panel rounded-2xl border border-white/5">
          <div className="flex items-center gap-3">
            {localSettings.theme === 'dark' ? <Moon className="text-zinc-400" /> : <Sun className="text-amber-500" />}
            <div>
              <span className="block font-bold dark:text-white text-slate-800 text-sm uppercase tracking-widest">Tema de Interfaz</span>
              <span className="text-[10px] dark:text-zinc-500 text-slate-500 uppercase font-bold">
                {localSettings.theme === 'dark' ? 'Modo Oscuro' : 'Modo Claro'}
              </span>
            </div>
          </div>
          <button 
            onClick={() => setLocalSettings(p => ({ ...p, theme: p.theme === 'dark' ? 'light' : 'dark' }))}
            className={`w-12 h-7 rounded-full p-1 transition-colors ${localSettings.theme === 'dark' ? 'bg-zinc-700' : 'bg-cyan-200'}`}
          >
            <div className={`w-5 h-5 rounded-full bg-white transform transition-transform ${localSettings.theme === 'dark' ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] dark:text-zinc-600 text-slate-400 mb-2">Conectividad IA</h3>
        
        <div className={`flex flex-col p-4 rounded-2xl border shadow-sm glass-panel transition-colors ${
          apiKeyStatus === 'ok' ? 'border-emerald-500/20' : 'border-red-500/20'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {apiKeyStatus === 'validating' ? (
                 <Loader2 className="animate-spin text-cyan-500" />
              ) : apiKeyStatus === 'ok' ? (
                 <ShieldCheck className="text-emerald-500" /> 
              ) : (
                 <AlertTriangle className="text-red-500" />
              )}
              <div>
                <span className={`block font-bold text-sm uppercase tracking-widest ${apiKeyStatus === 'ok' ? 'text-emerald-600 dark:text-emerald-400' : apiKeyStatus === 'validating' ? 'text-cyan-500' : 'text-red-600'}`}>
                  NÚCLEO GEMINI
                </span>
                <span className="text-[10px] dark:text-zinc-500 text-slate-500 font-mono">
                  {apiKeyStatus === 'ok' ? 'ENLACE ESTABLE' : apiKeyStatus === 'validating' ? 'VERIFICANDO ENLACE...' : 'SIN SEÑAL'}
                </span>
              </div>
            </div>
            <div className={`w-2 h-2 rounded-full ${apiKeyStatus === 'ok' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`} />
          </div>

          <div className="bg-slate-50 dark:bg-black/20 rounded-xl p-3 mb-3 border border-white/5">
            <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 flex items-center gap-2 uppercase tracking-widest">
                    <Key size={12} /> Access API Key
                </label>
                <button 
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="text-cyan-600 dark:text-cyan-400 text-[10px] font-bold flex items-center gap-1 hover:opacity-80 uppercase"
                >
                    {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                    {showApiKey ? 'Ocultar' : 'Revelar'}
                </button>
            </div>
            
            <input 
              type={showApiKey ? "text" : "password"}
              value={localSettings.apiKey}
              onChange={(e) => setLocalSettings(p => ({ ...p, apiKey: e.target.value }))}
              placeholder={getEffectiveApiKey() ? "ENCRIPTADA Y SEGURA" : "Pega llave de acceso..."}
              className="w-full bg-transparent border-b border-slate-300 dark:border-zinc-700 focus:border-cyan-500 outline-none text-sm dark:text-white text-slate-900 pb-2 placeholder:text-slate-400 font-mono tracking-wider"
            />
          </div>

          <button 
            onClick={handleTestApiKey}
            disabled={!localSettings.apiKey && !getEffectiveApiKey() || apiKeyStatus === 'validating'}
            className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-black rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 uppercase tracking-widest"
          >
            {apiKeyStatus === 'validating' ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
            Calibrar Conexión
          </button>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] dark:text-zinc-600 text-slate-400 mb-2">Módulo de Operación</h3>
        <div className="p-4 glass-panel rounded-2xl space-y-4 border border-white/5">
          <div className="flex items-center gap-3 border-b border-slate-200 dark:border-white/5 pb-4">
            <User className="text-cyan-600 dark:text-zinc-400" />
            <div className="flex-1">
              <span className="block font-bold dark:text-white text-slate-800 text-sm uppercase tracking-widest">Identificador</span>
              <input 
                 type="text"
                 value={localSettings.nickname}
                 onChange={(e) => setLocalSettings(p => ({ ...p, nickname: e.target.value }))}
                 className="w-full bg-transparent border-none outline-none text-xs dark:text-zinc-400 text-slate-500 font-medium placeholder:text-slate-400 uppercase tracking-wider"
                 placeholder="Técnico Netuno"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
             <button
                onClick={() => setLocalSettings(p => ({ ...p, profile: 'INSTALLER' }))}
                className={`p-3 rounded-lg border flex flex-col items-center gap-1 transition-all ${localSettings.profile === 'INSTALLER' ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-600 dark:text-white' : 'bg-transparent border-slate-200 dark:border-white/10 text-slate-400'}`}
             >
                <HardHat size={20} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Instalación</span>
             </button>
             <button
                onClick={() => setLocalSettings(p => ({ ...p, profile: 'TECHNICIAN' }))}
                className={`p-3 rounded-lg border flex flex-col items-center gap-1 transition-all ${localSettings.profile === 'TECHNICIAN' ? 'bg-violet-500/10 border-violet-500/50 text-violet-600 dark:text-white' : 'bg-transparent border-slate-200 dark:border-white/10 text-slate-400'}`}
             >
                <Cpu size={20} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Servicios</span>
             </button>
          </div>
        </div>
      </section>
      
      <section className="space-y-3">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] dark:text-zinc-600 text-slate-400 mb-2">Tarifas de Red - Instalaciones</h3>
        <div className="grid gap-3">
          {installerTypes.map((type) => (
            <div key={type} className="flex items-center justify-between p-3 glass-panel rounded-2xl border border-white/5">
              <span className="font-bold dark:text-zinc-300 text-slate-700 text-xs uppercase tracking-wider">{LABELS[type]}</span>
              
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 rounded-xl p-1">
                <button onClick={() => adjustPrice(type, -1)} className="p-2 text-slate-500 hover:text-cyan-600 rounded-lg"><Minus size={16} /></button>
                <div className="relative w-16">
                    <DollarSign size={10} className="absolute left-1 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="number" value={localSettings.customPrices[type] === 0 ? '' : localSettings.customPrices[type]} onChange={(e) => handleChangePrice(type, e.target.value)} placeholder="0" className="w-full bg-transparent text-center font-mono font-bold text-lg dark:text-white outline-none pl-3" />
                </div>
                <button onClick={() => adjustPrice(type, 1)} className="p-2 text-slate-500 hover:text-cyan-600 rounded-lg"><Plus size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] dark:text-zinc-600 text-slate-400 mb-2">Tarifas de Red - Soporte Técnico</h3>
        <div className="grid gap-3">
          {technicianTypes.map((type) => (
            <div key={type} className="flex items-center justify-between p-3 glass-panel rounded-2xl border-l-4 border-white/5" style={{ borderLeftColor: type.includes('REWIRING') ? '#f472b6' : '#fb923c' }}>
              <span className="font-bold dark:text-zinc-300 text-slate-700 text-[10px] uppercase tracking-wider">{LABELS[type]}</span>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 rounded-xl p-1">
                <button onClick={() => adjustPrice(type, -1)} className="p-2 text-slate-500 hover:text-orange-600 rounded-lg"><Minus size={16} /></button>
                <div className="relative w-16">
                    <DollarSign size={10} className="absolute left-1 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="number" value={localSettings.customPrices[type] === 0 ? '' : localSettings.customPrices[type]} onChange={(e) => handleChangePrice(type, e.target.value)} placeholder="0" className="w-full bg-transparent text-center font-mono font-bold text-lg dark:text-white outline-none pl-3" />
                </div>
                <button onClick={() => adjustPrice(type, 1)} className="p-2 text-slate-500 hover:text-orange-600 rounded-lg"><Plus size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] dark:text-zinc-600 text-slate-400 mb-2">Objetivo de Tráfico</h3>
        <div className="flex items-center justify-between p-4 glass-panel rounded-2xl border border-white/5">
          <div className="flex items-center gap-3">
            <Target className="text-emerald-500 dark:text-emerald-400" />
            <div>
              <span className="block font-bold dark:text-white text-slate-800 text-sm uppercase tracking-widest">CUOTA MENSUAL</span>
              <span className="text-[10px] dark:text-zinc-500 text-slate-500 font-bold uppercase">Meta de Ingresos</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <DollarSign size={14} className="text-slate-400" />
            <input 
               type="number"
               value={localSettings.monthlyGoal > 0 ? localSettings.monthlyGoal : ''}
               onChange={(e) => setLocalSettings(p => ({ ...p, monthlyGoal: parseFloat(e.target.value) || 0 }))}
               placeholder="0"
               className="w-24 bg-transparent border-b border-slate-300 dark:border-zinc-700 focus:border-cyan-500 outline-none text-right font-mono font-bold text-lg dark:text-white text-slate-900"
            />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] dark:text-zinc-600 text-slate-400 mb-2">Sintetizador Neural</h3>
        <div className="glass-panel p-4 rounded-2xl space-y-4 border border-white/5">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mic className="text-cyan-500" />
                <div>
                  <span className="block font-bold dark:text-white text-slate-800 text-sm uppercase tracking-widest">Protocolo de Voz</span>
                  <span className="text-[10px] dark:text-zinc-500 text-slate-500 uppercase font-bold">Respuesta del Asistente</span>
                </div>
              </div>
              <button 
                onClick={() => setLocalSettings(p => ({ ...p, ttsEnabled: !p.ttsEnabled }))}
                className={`w-12 h-7 rounded-full p-1 transition-colors ${localSettings.ttsEnabled ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-slate-300 dark:bg-zinc-700'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transform transition-transform ${localSettings.ttsEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
           </div>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] dark:text-zinc-600 text-slate-400 mb-2">Gestión de Paquetes</h3>
        <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={handleExportCSV}
              className="flex flex-col items-center justify-center gap-2 p-4 glass-panel rounded-2xl hover:bg-emerald-50/10 transition-colors group border border-white/5"
            >
              <FileSpreadsheet size={24} className="text-emerald-600 group-hover:scale-110 transition-transform" />
              <div className="text-center">
                <span className="block text-[10px] font-bold dark:text-zinc-300 text-slate-600 uppercase tracking-widest">Reporte CSV</span>
                <span className="text-[9px] text-slate-400 font-mono">NETUNO_DATA.csv</span>
              </div>
            </button>

            <button 
              onClick={handleExportJSON}
              className="flex flex-col items-center justify-center gap-2 p-4 glass-panel rounded-2xl hover:bg-blue-50/10 transition-colors group border border-white/5"
            >
              <Globe size={24} className="text-blue-500 group-hover:scale-110 transition-transform" />
              <div className="text-center">
                <span className="block text-[10px] font-bold dark:text-zinc-300 text-slate-600 uppercase tracking-widest">Backup Cloud</span>
                <span className="text-[9px] text-slate-400 font-mono">NETUNO_CORE.json</span>
              </div>
            </button>
        </div>
      </section>

      <section className="space-y-3 pt-6 border-t border-red-500/20">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-500 mb-2 flex items-center gap-2">
          <AlertTriangle size={12} /> Purga de Sistema
        </h3>
        <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/20 flex items-center justify-between">
          <div>
            <span className="block font-bold dark:text-red-200 text-red-800 text-sm uppercase tracking-widest">Borrado Maestro</span>
            <span className="text-[10px] text-red-500/70 block mt-1 uppercase font-bold">Eliminación permanente de registros.</span>
          </div>
          <button onClick={() => setShowWipeModal(true)} className="p-3 bg-red-500 text-white rounded-xl shadow-lg transition-all hover:scale-105 active:rotate-12">
            <Trash2 size={18} />
          </button>
        </div>
      </section>

      <div className="fixed bottom-24 left-0 right-0 px-4 flex justify-center z-40 pointer-events-none no-print">
        <button onClick={handleSave} className={`pointer-events-auto flex items-center gap-2 px-8 py-3 rounded-full font-bold shadow-xl transition-all transform uppercase tracking-[0.3em] text-xs ${isSaved ? 'bg-emerald-500 text-white scale-105' : 'bg-black dark:bg-white text-white dark:text-black hover:scale-105'}`}>
          <Save size={18} /> {isSaved ? 'SINCRONIZADO' : 'Sincronizar Todo'}
        </button>
      </div>

      <ConfirmationModal isOpen={showWipeModal} onClose={() => setShowWipeModal(false)} onConfirm={handleWipeData} title="ALERTA DE PURGA" message="Esta acción eliminará permanentemente todos tus registros de la red Netuno. El protocolo no es reversible." />
      <div className="h-24"></div>
    </div>
  );
};
