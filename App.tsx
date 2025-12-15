
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
  // State
  const [records, setRecords] = useState<InstallationRecord[]>([]);
  const [settings, setSettings] = useState<AppSettings>(getSettings());
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'history' | 'analysis' | 'settings'>('dashboard');
  
  // Visual Effects State
  const [showSuccessFlash, setShowSuccessFlash] = useState(false);
  const [isJarvisSpeaking, setIsJarvisSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [showBackupIndicator, setShowBackupIndicator] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'disconnected' | 'disabled'>('checking');

  // Tutorial State
  const [showTutorial, setShowTutorial] = useState(false);
  const [isNicknameModalOpen, setIsNicknameModalOpen] = useState(false);
  
  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  
  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [chatMode, setChatMode] = useState<'compact' | 'normal' | 'expanded'>('normal');
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const speakingRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Initialize Data & PWA check
  useEffect(() => {
    const initData = async () => {
      try {
        const data = await getRecords();
        setRecords(data);
      } catch (e) {
        console.error("Error loading data", e);
      } finally {
        setIsLoadingData(false);
      }
    };
    
    initData();

    const verifyBackend = async () => {
      const status = await checkBackendStatus();
      setBackendStatus(status);
    };
    verifyBackend();
    
    // Check Tutorial Status
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
    if (!hasSeenTutorial) {
      setShowTutorial(true);
    }

    // Check Nickname Status
    if (!settings.nickname) {
       setIsNicknameModalOpen(true);
    }

    // Apply Theme
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Initial Greeting
    setMessages([{
      id: 'init',
      sender: 'jarvis',
      text: 'Sistema en línea. Esperando informe de producción.'
    }]);

    // Check for iOS
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIosDevice);

    // Capture install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      console.log("Install prompt captured");
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Update theme when settings change
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  // Scroll to bottom of chat
  useEffect(() => {
    if (chatMode !== 'compact') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isMenuOpen, isWidgetOpen, isChatOpen, chatMode]);

  const triggerSuccessEffect = () => {
    setShowSuccessFlash(true);
    triggerBackupIndicator();
    setTimeout(() => {
      setShowSuccessFlash(false);
    }, 600); 
  };

  const triggerBackupIndicator = () => {
    setShowBackupIndicator(true);
    setTimeout(() => setShowBackupIndicator(false), 2000);
  };

  // TTS Helper
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
      } else {
        const jarvisCandidates = ['Google español de Estados Unidos', 'Microsoft Pablo', 'Microsoft Raul', 'Jorge', 'Juan'];
        const bestVoice = voices.find(v => jarvisCandidates.some(c => v.name.includes(c)));
        if (bestVoice) {
          utterance.voice = bestVoice;
        } else {
          const fallback = voices.find(v => v.lang === 'es-US' || v.lang === 'es-MX') || voices.find(v => v.lang.includes('es'));
          if (fallback) utterance.voice = fallback;
        }
      }

      utterance.onstart = () => setIsJarvisSpeaking(true);
      utterance.onend = () => setIsJarvisSpeaking(false);
      utterance.onerror = () => setIsJarvisSpeaking(false);
      
      speakingRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleUpdateSettings = (newSettings: AppSettings) => {
    // If API key changed, reset the chat session to use the new key
    if (settings.apiKey !== newSettings.apiKey) {
        resetChat();
    }
    setSettings(newSettings);
    saveSettings(newSettings);
    // Important: Reset Chat also when profile changes to update system prompt context
    if (settings.profile !== newSettings.profile) {
       resetChat();
    }
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

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      setIsInstallModalOpen(true);
    }
    setIsMenuOpen(false);
  };

  // ASYNC: Handle Quick Add via Widget (Single or Batch)
  const handleQuickAdd = async (type: InstallType, quantity: number = 1, dateStr?: string) => {
    const newRecordsList = await saveRecord(type, quantity, dateStr);
    setRecords(newRecordsList);
    triggerSuccessEffect();
    
    const label = LABELS[type] || type;
    const responseText = quantity > 1 
      ? `Registrados ${quantity} servicios de ${label}.`
      : `Registro de ${label} completado.`;

    const confirmMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'jarvis',
      text: responseText
    };
    setMessages(prev => [...prev, confirmMsg]);
    setIsWidgetOpen(false);
    speakText(responseText);
  };

  // ASYNC: Handle User Input
  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    // If chat is compacted, open to normal so user sees the flow
    if (chatMode === 'compact') setChatMode('normal');

    const userMsg: ChatMessage = { id: Date.now().toString(), sender: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setIsProcessing(true);

    const result: ExtractedData = await processUserMessage(text, records);

    if (result.intent === 'LOGGING' && result.records && result.records.length > 0) {
      let currentList = [...records];
      for (const rec of result.records) {
         currentList = await saveRecord(rec.type as any, rec.quantity, rec.date);
      }
      setRecords(currentList); 
      triggerSuccessEffect();
    }

    const jarvisMsg: ChatMessage = { 
      id: (Date.now() + 1).toString(), 
      sender: 'jarvis', 
      text: result.jarvisResponse 
    };
    
    setMessages(prev => [...prev, jarvisMsg]);
    setIsProcessing(false);
    speakText(result.jarvisResponse);
  };

  const handleRequestDelete = (id: string) => {
    setRecordToDelete(id);
  };

  // ASYNC: Confirm Delete
  const confirmDelete = async () => {
    if (recordToDelete) {
      const updated = await deleteRecord(recordToDelete);
      setRecords(updated);
      setRecordToDelete(null);
      triggerBackupIndicator();
    }
  };

  const navigateTo = (view: typeof currentView) => {
    setCurrentView(view);
    setIsMenuOpen(false);
  };

  const getDeleteModalTitle = () => {
    if (!recordToDelete) return 'ELIMINAR';
    const rec = records.find(r => r.id === recordToDelete);
    if (rec && LABELS[rec.type]) {
      return `ELIMINAR ${LABELS[rec.type].toUpperCase()}`;
    }
    return 'ELIMINAR REGISTRO';
  };

  // Logic to determine if chat is effectively hidden by view routing
  const isViewHidingChat = currentView === 'settings' || currentView === 'analysis';
  
  // Calculate chat container class based on mode
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
      
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent h-[10%] w-full animate-scanline z-0 pointer-events-none" />
        <div className="dark:hidden absolute top-0 left-0 w-full h-full bg-gradient-to-b from-blue-50 to-slate-100" />
        <div className="dark:hidden absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-400/20 rounded-full blur-[100px]" />
        <div className="hidden dark:block absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-zinc-900/50 to-transparent" />
        <div className="hidden dark:block absolute top-[-10%] left-[-10%] w-[400px] h-[400px] bg-zinc-800/20 rounded-full blur-[80px]" />
      </div>

      {/* SUCCESS FLASH OVERLAY */}
      {showSuccessFlash && (
        <div className="fixed inset-0 z-[100] pointer-events-none animate-flash">
           <div className="absolute inset-0 border-[4px] border-emerald-500/50 dark:border-cyan-500/30 rounded-lg box-border shadow-[inset_0_0_50px_rgba(16,185,129,0.3)]"></div>
           <div className="absolute inset-0 bg-emerald-500/5 dark:bg-cyan-500/5"></div>
        </div>
      )}

      <VoiceVisualizer isActive={isJarvisSpeaking} mode="jarvis" />
      <VoiceVisualizer isActive={isUserSpeaking} mode="user" />

      {/* BACKUP INDICATOR TOAST */}
      <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[80] transition-all duration-500 ${showBackupIndicator ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
         <div className="bg-emerald-500/90 dark:bg-emerald-900/90 text-white dark:text-emerald-100 px-4 py-2 rounded-full text-xs font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-2 border border-white/10 backdrop-blur-md">
            <Save size={14} className="animate-pulse" />
            COPIA DE SEGURIDAD AUTO
         </div>
      </div>

      {/* MODALS */}
      <InstallModal isOpen={isInstallModalOpen} onClose={() => setIsInstallModalOpen(false)} isIOS={isIOS} />
      <NicknameModal isOpen={isNicknameModalOpen} onSave={handleSaveNickname} />
      {showTutorial && !isNicknameModalOpen && <WelcomeTutorial onComplete={handleTutorialComplete} username={settings.nickname} />}

      {/* Header */}
      <nav className="fixed top-0 w-full glass-panel z-50 h-20 flex items-center justify-between px-4 transition-all border-b border-white/10 shadow-sm backdrop-blur-xl">
        <div className="flex items-center gap-3" onClick={() => navigateTo('dashboard')}>
          <div className="relative">
             <Aperture size={32} className="text-cyan-600 dark:text-cyan-400 animate-spin-slow" />
             <div className="absolute inset-0 bg-cyan-400/20 blur-lg rounded-full animate-pulse" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold tracking-[0.2em] leading-none dark:text-zinc-100 text-slate-900">NETUNO</h1>
            <span className="text-[10px] text-cyan-600 dark:text-cyan-500 font-mono tracking-widest font-bold">JARVIS SYSTEM v7.2</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button onClick={() => setIsWidgetOpen(true)} className="p-3 text-cyan-700 dark:text-zinc-400 hover:text-cyan-900 dark:hover:text-white transition-colors bg-white/50 dark:bg-zinc-800/50 rounded-lg backdrop-blur border border-white/20 dark:border-white/5 shadow-inner">
            <LayoutGrid size={22} />
          </button>
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-3 text-slate-700 dark:text-zinc-400 transition-colors hover:text-black dark:hover:text-white">
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Navigation Menu */}
      {isMenuOpen && (
        <div className="fixed top-20 right-0 w-64 glass-panel border-l border-b rounded-bl-3xl z-[60] shadow-2xl animate-fadeIn p-4 h-[calc(100vh-5rem)]">
           <div className="flex flex-col gap-3">
              <span className="text-xs dark:text-zinc-500 text-slate-400 font-bold tracking-widest uppercase mb-1">Navegación</span>
              <button onClick={() => navigateTo('dashboard')} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${currentView === 'dashboard' ? 'bg-cyan-100/50 dark:bg-white/10 text-cyan-700 dark:text-white font-bold' : 'hover:bg-black/5 dark:hover:bg-white/5 dark:text-zinc-400'}`}>
                <LayoutDashboard size={20} /> <span>Panel Principal</span>
              </button>
              <button onClick={() => navigateTo('history')} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${currentView === 'history' ? 'bg-cyan-100/50 dark:bg-white/10 text-cyan-700 dark:text-white font-bold' : 'hover:bg-black/5 dark:hover:bg-white/5 dark:text-zinc-400'}`}>
                <List size={20} /> <span>Historial</span>
              </button>
              <button onClick={() => navigateTo('analysis')} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${currentView === 'analysis' ? 'bg-cyan-100/50 dark:bg-white/10 text-cyan-700 dark:text-white font-bold' : 'hover:bg-black/5 dark:hover:bg-white/5 dark:text-zinc-400'}`}>
                <BarChart3 size={20} /> <span>Análisis</span>
              </button>
              <button onClick={() => navigateTo('settings')} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${currentView === 'settings' ? 'bg-cyan-100/50 dark:bg-white/10 text-cyan-700 dark:text-white font-bold' : 'hover:bg-black/5 dark:hover:bg-white/5 dark:text-zinc-400'}`}>
                <SettingsIcon size={20} /> <span>Configuración</span>
              </button>
              <div className="h-px bg-slate-200 dark:bg-white/10 my-2" />
              <button onClick={handleInstallClick} className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 dark:bg-white dark:text-black text-white shadow-lg hover:scale-105 transition-transform">
                {isIOS ? <Share size={20} /> : <Download size={20} />}
                <span className="font-bold">Instalar App</span>
              </button>
           </div>
        </div>
      )}

      <QuickWidget isOpen={isWidgetOpen} onClose={() => setIsWidgetOpen(false)} onQuickAdd={handleQuickAdd} prices={settings.customPrices} />
      <ConfirmationModal isOpen={!!recordToDelete} onClose={() => setRecordToDelete(null)} onConfirm={confirmDelete} title={getDeleteModalTitle()} message="¿Eliminar este registro permanentemente?" />

      {/* Main Content Area */}
      <main className="pt-28 px-4 pb-48 max-w-2xl mx-auto z-10 relative min-h-screen">
        {isLoadingData ? (
           <div className="flex flex-col items-center justify-center py-20 opacity-50">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mb-2"></div>
             <span className="text-xs tracking-widest text-slate-500 dark:text-zinc-500">SINCRONIZANDO DATOS...</span>
           </div>
        ) : (
          <>
             {currentView === 'dashboard' && <Dashboard records={records} username={settings.nickname} settings={settings} navigateTo={navigateTo} backendStatus={backendStatus} />}
             {currentView === 'history' && <HistoryView records={records} onDelete={handleRequestDelete} />}
             {currentView === 'analysis' && <AnalysisView records={records} />}
             {currentView === 'settings' && <SettingsView settings={settings} onSave={handleUpdateSettings} />}
          </>
        )}
      </main>

      {/* Chat Minimize Toggle (Floating Action Button) */}
      {!isChatOpen && !isViewHidingChat && (
        <button 
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 z-50 p-4 bg-black dark:bg-cyan-600 text-white rounded-full shadow-2xl hover:scale-110 transition-all duration-300 animate-slideUp flex items-center justify-center group"
        >
          <Bot size={28} className="group-hover:rotate-12 transition-transform" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
             <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
          </span>
        </button>
      )}

      {/* Sticky Chat Interface */}
      <div className={`fixed bottom-0 w-full z-40 glass-panel border-t transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${isViewHidingChat || !isChatOpen ? 'translate-y-full' : 'translate-y-0'}`}>
        
        {/* Resize Handle / Controls */}
        <div className="absolute -top-10 left-0 right-0 flex justify-center items-end gap-2 pointer-events-none px-4">
           {/* Size Toggles */}
           <div className="flex bg-white/80 dark:bg-zinc-800/80 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-t-xl shadow-lg pointer-events-auto overflow-hidden">
             
             {/* Compact Mode (Only Input) */}
             <button 
               onClick={() => setChatMode('compact')}
               className={`p-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${chatMode === 'compact' ? 'text-cyan-500' : 'text-slate-400 dark:text-zinc-500'}`}
               title="Vista Compacta"
             >
               <Minus size={16} />
             </button>

             {/* Normal Mode */}
             <button 
               onClick={() => setChatMode('normal')}
               className={`p-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${chatMode === 'normal' ? 'text-cyan-500' : 'text-slate-400 dark:text-zinc-500'}`}
               title="Vista Normal"
             >
               <Square size={14} />
             </button>

             {/* Expanded Mode */}
             <button 
               onClick={() => setChatMode('expanded')}
               className={`p-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${chatMode === 'expanded' ? 'text-cyan-500' : 'text-slate-400 dark:text-zinc-500'}`}
               title="Expandir"
             >
               <Maximize2 size={14} />
             </button>

             <div className="w-px bg-slate-200 dark:bg-white/10 mx-1 my-3"></div>

             {/* Close / Minimize */}
             <button 
               onClick={() => setIsChatOpen(false)}
               className="p-3 hover:text-red-500 text-slate-400 dark:text-zinc-500 transition-colors"
               title="Ocultar"
             >
               <ChevronDown size={16} />
             </button>
           </div>
        </div>

        <div className="max-w-2xl mx-auto transition-all duration-300">
          <div className={`${getChatHeightClass()} transition-all duration-300`}>
            {messagesToShow.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm backdrop-blur-sm ${msg.sender === 'user' ? 'bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-zinc-700 dark:to-zinc-800 text-white rounded-br-none' : 'bg-white/60 dark:bg-white/10 dark:text-zinc-200 text-slate-800 border border-white/20 dark:border-white/5 rounded-bl-none'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-white/50 dark:bg-white/5 text-cyan-600 dark:text-zinc-400 border border-white/20 dark:border-white/5 rounded-full px-4 py-2 text-xs flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce delay-75" />
                  <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce delay-150" />
                  Pensando...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <ChatBar 
            onSendMessage={handleSend}
            isProcessing={isProcessing}
            onVoiceStateChange={setIsUserSpeaking}
          />
        </div>
      </div>
    </div>
  );
};

export default App;
