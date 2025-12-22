
import React, { useState, useEffect, useRef } from 'react';
import { getRecords, saveRecord, deleteRecord, checkBackendStatus } from './services/storageService';
import { processUserMessage, resetChat } from './services/geminiService';
import { getSettings, saveSettings } from './services/settingsService';
import { Dashboard } from './components/Dashboard';
import { HistoryView } from './components/HistoryView';
import { SettingsView } from './components/SettingsView';
import { AnalysisView } from './components/AnalysisView';
import { VoiceVisualizer } from './components/VoiceVisualizer';
import { QuickWidget } from './components/QuickWidget';
import { ConfirmationModal } from './components/ConfirmationModal';
import { NicknameModal } from './components/NicknameModal';
import { WelcomeTutorial } from './components/WelcomeTutorial';
import { InstallModal } from './components/InstallModal';
import { ChatBar } from './components/ChatBar';
import { InstallationRecord, ChatMessage, ExtractedData, InstallType, AppSettings, UserProfile } from './types';
import { LABELS } from './constants';
import { Menu, X, Aperture, LayoutGrid, LayoutDashboard, List, Settings as SettingsIcon, Download, Share, Save, BarChart3, ChevronDown, Bot, Maximize2, Minus, Square } from 'lucide-react';

const App: React.FC = () => {
  const [records, setRecords] = useState<InstallationRecord[]>([]);
  const [settings, setSettings] = useState<AppSettings>(getSettings());
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'history' | 'analysis' | 'settings'>('dashboard');
  const [showSuccessFlash, setShowSuccessFlash] = useState(false);
  const [isJarvisSpeaking, setIsJarvisSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [showBackupIndicator, setShowBackupIndicator] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'disconnected' | 'disabled'>('checking');
  const [showTutorial, setShowTutorial] = useState(false);
  const [isNicknameModalOpen, setIsNicknameModalOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [chatMode, setChatMode] = useState<'compact' | 'normal' | 'expanded'>('normal');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const speakingRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const initData = async () => {
      try {
        const data = await getRecords();
        setRecords(data);
      } catch (e) { console.error(e); } finally { setIsLoadingData(false); }
    };
    initData();
    const verifyBackend = async () => {
      const status = await checkBackendStatus();
      setBackendStatus(status);
    };
    verifyBackend();
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
    if (!hasSeenTutorial) setShowTutorial(true);
    if (!settings.nickname) setIsNicknameModalOpen(true);
    if (settings.theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    setMessages([{ id: 'init', sender: 'jarvis', text: 'Sistema en línea. Esperando informe de producción.' }]);
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIosDevice);
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  useEffect(() => {
    if (settings.theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [settings.theme]);

  useEffect(() => {
    if (chatMode !== 'compact') messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isMenuOpen, isWidgetOpen, isChatOpen, chatMode]);

  const triggerSuccessEffect = () => {
    setShowSuccessFlash(true);
    setShowBackupIndicator(true);
    setTimeout(() => {
      setShowSuccessFlash(false);
      setShowBackupIndicator(false);
    }, 2000); 
  };

  const speakText = (text: string) => {
    if (settings.ttsEnabled && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      utterance.pitch = settings.voiceSettings.pitch;
      utterance.rate = settings.voiceSettings.rate;
      const voices = window.speechSynthesis.getVoices();
      if (settings.voiceSettings.voiceURI) {
        const selected = voices.find(v => v.voiceURI === settings.voiceSettings.voiceURI);
        if (selected) utterance.voice = selected;
      }
      utterance.onstart = () => setIsJarvisSpeaking(true);
      utterance.onend = () => setIsJarvisSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleUpdateSettings = (newSettings: AppSettings) => {
    if (settings.apiKey !== newSettings.apiKey) resetChat();
    setSettings(newSettings);
    saveSettings(newSettings);
    if (settings.profile !== newSettings.profile) resetChat();
  };

  const handleSaveNickname = (name: string, profile: UserProfile) => {
    const newSettings = { ...settings, nickname: name, profile: profile };
    setSettings(newSettings);
    saveSettings(newSettings);
    setIsNicknameModalOpen(false);
  };

  const handleTutorialComplete = () => {
    localStorage.setItem('hasSeenTutorial', 'true');
    setShowTutorial(false);
  };

  const handleQuickAdd = async (type: InstallType, quantity: number = 1, dateStr?: string) => {
    const newRecordsList = await saveRecord(type, quantity, dateStr);
    setRecords(newRecordsList);
    triggerSuccessEffect();
    const responseText = `Registro de ${LABELS[type]} completado.`;
    setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'jarvis', text: responseText }]);
    setIsWidgetOpen(false);
    speakText(responseText);
  };

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    if (chatMode === 'compact') setChatMode('normal');
    setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'user', text }]);
    setIsProcessing(true);

    const result: ExtractedData = await processUserMessage(text, records);

    if (result.intent === 'LOGGING' && result.records?.length > 0) {
      let currentList = [...records];
      for (const rec of result.records) {
         currentList = await saveRecord(rec.type as any, rec.quantity, rec.date);
      }
      setRecords(currentList); 
      triggerSuccessEffect();
    } else if (result.intent === 'DELETION') {
      // Lógica de identificación de registro para borrar
      let matchId: string | null = null;
      if (result.deletionTarget?.last) {
        const sorted = [...records].sort((a, b) => b.timestamp - a.timestamp);
        if (sorted.length > 0) matchId = sorted[0].id;
      } else if (result.deletionTarget?.type) {
        const typeMatch = records.filter(r => r.type === result.deletionTarget?.type)
                                .sort((a, b) => b.timestamp - a.timestamp);
        if (typeMatch.length > 0) matchId = typeMatch[0].id;
      }

      if (matchId) {
        setRecordToDelete(matchId);
      } else {
        result.jarvisResponse = "No he podido localizar el registro específico que mencionas.";
      }
    }

    setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'jarvis', text: result.jarvisResponse }]);
    setIsProcessing(false);
    speakText(result.jarvisResponse);
  };

  const confirmDelete = async () => {
    if (recordToDelete) {
      const updated = await deleteRecord(recordToDelete);
      setRecords(updated);
      setRecordToDelete(null);
      speakText("Registro eliminado correctamente.");
    }
  };

  const navigateTo = (view: typeof currentView) => {
    setCurrentView(view);
    setIsMenuOpen(false);
  };

  const getDeleteModalTitle = () => {
    if (!recordToDelete) return 'ELIMINAR';
    const rec = records.find(r => r.id === recordToDelete);
    return rec ? `ELIMINAR ${LABELS[rec.type].toUpperCase()}` : 'ELIMINAR REGISTRO';
  };

  const isViewHidingChat = currentView === 'settings' || currentView === 'analysis';
  const getChatHeightClass = () => {
    switch(chatMode) {
      case 'compact': return 'h-0 overflow-hidden py-0';
      case 'expanded': return 'h-[60vh] overflow-y-auto px-4 pt-4 pb-2 space-y-3';
      case 'normal': default: return 'max-h-64 overflow-y-auto px-4 pt-4 pb-2 space-y-3';
    }
  };
  const messagesToShow = chatMode === 'expanded' ? messages : messages.slice(-4);

  return (
    <div className="min-h-screen dark:bg-zinc-950 bg-slate-100 dark:text-zinc-100 text-slate-800 font-rajdhani relative overflow-hidden transition-colors duration-500">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent h-[10%] w-full animate-scanline z-0 pointer-events-none" />
        <div className="dark:hidden absolute top-0 left-0 w-full h-full bg-gradient-to-b from-blue-50 to-slate-100" />
      </div>
      {showSuccessFlash && (
        <div className="fixed inset-0 z-[100] pointer-events-none animate-flash">
           <div className="absolute inset-0 border-[4px] border-emerald-500/50 dark:border-cyan-500/30 rounded-lg box-border shadow-[inset_0_0_50px_rgba(16,185,129,0.3)]"></div>
        </div>
      )}
      <VoiceVisualizer isActive={isJarvisSpeaking} mode="jarvis" />
      <VoiceVisualizer isActive={isUserSpeaking} mode="user" />
      <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[80] transition-all duration-500 ${showBackupIndicator ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
         <div className="bg-emerald-500/90 dark:bg-emerald-900/90 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg flex items-center gap-2 border border-white/10 backdrop-blur-md">
            <Save size={14} className="animate-pulse" /> COPIA DE SEGURIDAD AUTO
         </div>
      </div>
      <InstallModal isOpen={isInstallModalOpen} onClose={() => setIsInstallModalOpen(false)} isIOS={isIOS} />
      <NicknameModal isOpen={isNicknameModalOpen} onSave={handleSaveNickname} />
      {showTutorial && !isNicknameModalOpen && <WelcomeTutorial onComplete={handleTutorialComplete} username={settings.nickname} />}
      <nav className="fixed top-0 w-full glass-panel z-50 h-20 flex items-center justify-between px-4 transition-all border-b border-white/10 shadow-sm backdrop-blur-xl">
        <div className="flex items-center gap-3" onClick={() => navigateTo('dashboard')}>
          <Aperture size={32} className="text-cyan-600 dark:text-cyan-400 animate-spin-slow" />
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold tracking-[0.2em] leading-none dark:text-zinc-100 text-slate-900">NETUNO</h1>
            <span className="text-[10px] text-cyan-600 dark:text-cyan-500 font-mono tracking-widest font-bold">JARVIS SYSTEM v7.2</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsWidgetOpen(true)} className="p-3 text-cyan-700 dark:text-zinc-400 bg-white/50 dark:bg-zinc-800/50 rounded-lg border border-white/20 dark:border-white/5 shadow-inner">
            <LayoutGrid size={22} />
          </button>
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-3 text-slate-700 dark:text-zinc-400">
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>
      {isMenuOpen && (
        <div className="fixed top-20 right-0 w-64 glass-panel border-l border-b rounded-bl-3xl z-[60] shadow-2xl animate-fadeIn p-4 h-[calc(100vh-5rem)]">
           <div className="flex flex-col gap-3">
              <button onClick={() => navigateTo('dashboard')} className={`flex items-center gap-3 p-3 rounded-xl ${currentView === 'dashboard' ? 'bg-cyan-100/50 dark:bg-white/10 text-cyan-700 font-bold' : ''}`}><LayoutDashboard size={20} /> <span>Panel Principal</span></button>
              <button onClick={() => navigateTo('history')} className={`flex items-center gap-3 p-3 rounded-xl ${currentView === 'history' ? 'bg-cyan-100/50 dark:bg-white/10 text-cyan-700 font-bold' : ''}`}><List size={20} /> <span>Historial</span></button>
              <button onClick={() => navigateTo('analysis')} className={`flex items-center gap-3 p-3 rounded-xl ${currentView === 'analysis' ? 'bg-cyan-100/50 dark:bg-white/10 text-cyan-700 font-bold' : ''}`}><BarChart3 size={20} /> <span>Análisis</span></button>
              <button onClick={() => navigateTo('settings')} className={`flex items-center gap-3 p-3 rounded-xl ${currentView === 'settings' ? 'bg-cyan-100/50 dark:bg-white/10 text-cyan-700 font-bold' : ''}`}><SettingsIcon size={20} /> <span>Configuración</span></button>
           </div>
        </div>
      )}
      <QuickWidget isOpen={isWidgetOpen} onClose={() => setIsWidgetOpen(false)} onQuickAdd={handleQuickAdd} prices={settings.customPrices} />
      <ConfirmationModal isOpen={!!recordToDelete} onClose={() => setRecordToDelete(null)} onConfirm={confirmDelete} title={getDeleteModalTitle()} message="Jarvis ha localizado el registro. ¿Confirmas su eliminación permanente?" />
      <main className="pt-28 px-4 pb-48 max-w-2xl mx-auto z-10 relative min-h-screen">
        {isLoadingData ? (
           <div className="flex flex-col items-center justify-center py-20 opacity-50">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mb-2"></div>
             <span className="text-xs tracking-widest">SINCRONIZANDO DATOS...</span>
           </div>
        ) : (
          <>
             {currentView === 'dashboard' && <Dashboard records={records} username={settings.nickname} settings={settings} navigateTo={navigateTo} backendStatus={backendStatus} />}
             {currentView === 'history' && <HistoryView records={records} onDelete={setRecordToDelete} />}
             {currentView === 'analysis' && <AnalysisView records={records} />}
             {currentView === 'settings' && <SettingsView settings={settings} onSave={handleUpdateSettings} />}
          </>
        )}
      </main>
      {!isChatOpen && !isViewHidingChat && (
        <button onClick={() => setIsChatOpen(true)} className="fixed bottom-6 right-6 z-50 p-4 bg-black dark:bg-cyan-600 text-white rounded-full shadow-2xl animate-slideUp group">
          <Bot size={28} className="group-hover:rotate-12 transition-transform" />
        </button>
      )}
      <div className={`fixed bottom-0 w-full z-40 glass-panel border-t transition-transform duration-500 ${isViewHidingChat || !isChatOpen ? 'translate-y-full' : 'translate-y-0'}`}>
        <div className="absolute -top-10 left-0 right-0 flex justify-center items-end gap-2 pointer-events-none px-4">
           <div className="flex bg-white/80 dark:bg-zinc-800/80 rounded-t-xl shadow-lg pointer-events-auto">
             <button onClick={() => setChatMode('compact')} className={`p-3 ${chatMode === 'compact' ? 'text-cyan-500' : ''}`}><Minus size={16} /></button>
             <button onClick={() => setChatMode('normal')} className={`p-3 ${chatMode === 'normal' ? 'text-cyan-500' : ''}`}><Square size={14} /></button>
             <button onClick={() => setChatMode('expanded')} className={`p-3 ${chatMode === 'expanded' ? 'text-cyan-500' : ''}`}><Maximize2 size={14} /></button>
             <button onClick={() => setIsChatOpen(false)} className="p-3"><ChevronDown size={16} /></button>
           </div>
        </div>
        <div className="max-w-2xl mx-auto">
          <div className={getChatHeightClass()}>
            {messagesToShow.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${msg.sender === 'user' ? 'bg-cyan-600 dark:bg-zinc-700 text-white' : 'bg-white/60 dark:bg-white/10 dark:text-zinc-200'}`}>{msg.text}</div>
              </div>
            ))}
            {isProcessing && <div className="text-xs text-cyan-600 animate-pulse">Jarvis está procesando...</div>}
            <div ref={messagesEndRef} />
          </div>
          <ChatBar onSendMessage={handleSend} isProcessing={isProcessing} onVoiceStateChange={setIsUserSpeaking} />
        </div>
      </div>
    </div>
  );
};

export default App;
