import React, { useState, useEffect, useRef } from 'react';
import { getRecords, saveRecord, deleteRecord } from './services/storageService';
import { processUserMessage } from './services/geminiService';
import { getSettings, saveSettings } from './services/settingsService';
import { Dashboard } from './components/Dashboard';
import { HistoryView } from './components/HistoryView';
import { SettingsView } from './components/SettingsView';
import { VoiceInput } from './components/VoiceInput';
import { QuickWidget } from './components/QuickWidget';
import { ConfirmationModal } from './components/ConfirmationModal';
import { WelcomeTutorial } from './components/WelcomeTutorial';
import { InstallationRecord, ChatMessage, ExtractedData, InstallType, AppSettings } from './types';
import { Send, Menu, X, Bot, LayoutGrid, LayoutDashboard, List, Settings as SettingsIcon, Download, Share } from 'lucide-react';

const App: React.FC = () => {
  // State
  const [records, setRecords] = useState<InstallationRecord[]>([]);
  const [settings, setSettings] = useState<AppSettings>(getSettings());
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'history' | 'settings'>('dashboard');
  
  // Tutorial State
  const [showTutorial, setShowTutorial] = useState(false);
  
  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  
  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Data & PWA check
  useEffect(() => {
    setRecords(getRecords());
    
    // Check Tutorial Status
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
    if (!hasSeenTutorial) {
      setShowTutorial(true);
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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isMenuOpen, isWidgetOpen]);

  // TTS Helper
  const speakText = (text: string) => {
    if (settings.ttsEnabled && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      const voices = window.speechSynthesis.getVoices();
      const spanishVoice = voices.find(v => v.lang.includes('es') && v.name.includes('Google'));
      if (spanishVoice) utterance.voice = spanishVoice;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleTutorialComplete = () => {
    localStorage.setItem('hasSeenTutorial', 'true');
    setShowTutorial(false);
  };

  // PWA Install Handler
  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else if (isIOS) {
      alert("Para instalar en iOS: Toca el botón 'Compartir' (cuadrado con flecha) y selecciona 'Agregar a Inicio'.");
    } else {
       alert("Si no ves el botón de instalación, busca la opción 'Instalar aplicación' en el menú de tu navegador.");
    }
    setIsMenuOpen(false);
  };

  // Handle Quick Add via Widget
  const handleQuickAdd = (type: InstallType) => {
    const newRecordsList = saveRecord(type, 1);
    setRecords(newRecordsList);
    
    const responseText = `Registro rápido completado: 1 ${type} agregada correctamente.`;
    const confirmMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'jarvis',
      text: responseText
    };
    setMessages(prev => [...prev, confirmMsg]);
    setIsWidgetOpen(false);
    speakText(responseText);
  };

  // Handle User Input
  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    // Add User Message
    const userMsg: ChatMessage = { id: Date.now().toString(), sender: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsProcessing(true);

    // Call Gemini
    const result: ExtractedData = await processUserMessage(text, new Date().toDateString());

    // Process Records
    if (result.records && result.records.length > 0) {
      let newRecordsList: InstallationRecord[] = [];
      result.records.forEach(rec => {
        newRecordsList = saveRecord(rec.type as any, rec.quantity, rec.date);
      });
      setRecords(newRecordsList); 
    }

    // Add Jarvis Response
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

  const confirmDelete = () => {
    if (recordToDelete) {
      const updated = deleteRecord(recordToDelete);
      setRecords(updated);
      setRecordToDelete(null);
    }
  };

  const navigateTo = (view: typeof currentView) => {
    setCurrentView(view);
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen dark:bg-zinc-950 bg-slate-100 dark:text-zinc-100 text-slate-800 font-rajdhani relative overflow-hidden transition-colors duration-500">
      
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Light Mode: Blue Accents */}
        <div className="dark:hidden absolute top-0 left-0 w-full h-full bg-gradient-to-b from-blue-50 to-slate-100" />
        <div className="dark:hidden absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-400/20 rounded-full blur-[100px]" />
        
        {/* Dark Mode: Elegant Gray/Black - No loud colors */}
        <div className="hidden dark:block absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-zinc-900/50 to-transparent" />
        <div className="hidden dark:block absolute top-[-10%] left-[-10%] w-[400px] h-[400px] bg-zinc-800/20 rounded-full blur-[80px]" />
      </div>

      {showTutorial && <WelcomeTutorial onComplete={handleTutorialComplete} />}

      {/* Header */}
      <nav className="fixed top-0 w-full glass-panel z-50 h-16 flex items-center justify-between px-4 transition-all">
        <div className="flex items-center gap-2" onClick={() => navigateTo('dashboard')}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 dark:from-zinc-800 dark:to-zinc-900 flex items-center justify-center text-white dark:text-zinc-400 dark:border dark:border-white/10 shadow-lg">
            <Bot size={20} />
          </div>
          <h1 className="text-xl font-bold tracking-widest dark:text-zinc-100 text-slate-800">JARVIS<span className="text-cyan-600 dark:text-zinc-500">.APP</span></h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsWidgetOpen(true)}
            className="p-2 text-cyan-700 dark:text-zinc-400 hover:text-cyan-900 dark:hover:text-white transition-colors bg-white/50 dark:bg-zinc-800/50 rounded-lg backdrop-blur border border-white/20 dark:border-white/5"
          >
            <LayoutGrid size={20} />
          </button>
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 text-slate-700 dark:text-zinc-400 transition-colors hover:text-black dark:hover:text-white"
          >
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* Navigation Menu */}
      {isMenuOpen && (
        <div className="fixed top-16 right-0 w-64 glass-panel border-l border-b rounded-bl-3xl z-[60] shadow-2xl animate-fadeIn p-4 h-[calc(100vh-4rem)]">
           <div className="flex flex-col gap-3">
              <span className="text-xs dark:text-zinc-500 text-slate-400 font-bold tracking-widest uppercase mb-1">Navegación</span>
              
              <button onClick={() => navigateTo('dashboard')} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${currentView === 'dashboard' ? 'bg-cyan-100/50 dark:bg-white/10 text-cyan-700 dark:text-white font-bold' : 'hover:bg-black/5 dark:hover:bg-white/5 dark:text-zinc-400'}`}>
                <LayoutDashboard size={20} /> <span>Panel Principal</span>
              </button>
              
              <button onClick={() => navigateTo('history')} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${currentView === 'history' ? 'bg-cyan-100/50 dark:bg-white/10 text-cyan-700 dark:text-white font-bold' : 'hover:bg-black/5 dark:hover:bg-white/5 dark:text-zinc-400'}`}>
                <List size={20} /> <span>Historial</span>
              </button>
              
              <button onClick={() => navigateTo('settings')} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${currentView === 'settings' ? 'bg-cyan-100/50 dark:bg-white/10 text-cyan-700 dark:text-white font-bold' : 'hover:bg-black/5 dark:hover:bg-white/5 dark:text-zinc-400'}`}>
                <SettingsIcon size={20} /> <span>Configuración</span>
              </button>

              <div className="h-px bg-slate-200 dark:bg-white/10 my-2" />
              
              <button 
                onClick={handleInstallClick}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 dark:bg-white dark:text-black text-white shadow-lg hover:scale-105 transition-transform"
              >
                {isIOS ? <Share size={20} /> : <Download size={20} />}
                <span className="font-bold">Instalar App</span>
              </button>
           </div>
        </div>
      )}

      {/* Quick Widget Overlay */}
      <QuickWidget 
        isOpen={isWidgetOpen} 
        onClose={() => setIsWidgetOpen(false)} 
        onQuickAdd={handleQuickAdd} 
        prices={settings.customPrices}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!recordToDelete}
        onClose={() => setRecordToDelete(null)}
        onConfirm={confirmDelete}
        title="ELIMINAR"
        message="¿Eliminar este registro permanentemente?"
      />

      {/* Main Content Area */}
      <main className="pt-24 px-4 pb-48 max-w-2xl mx-auto z-10 relative min-h-screen">
        {currentView === 'dashboard' && <Dashboard records={records} />}
        {currentView === 'history' && <HistoryView records={records} onDelete={handleRequestDelete} />}
        {currentView === 'settings' && <SettingsView settings={settings} onSave={handleUpdateSettings} />}
      </main>

      {/* Sticky Chat Interface */}
      <div className={`fixed bottom-0 w-full z-40 glass-panel border-t transition-transform duration-300 ${currentView === 'settings' ? 'translate-y-full' : 'translate-y-0'}`}>
        <div className="max-w-2xl mx-auto">
          {/* Chat History Overlay */}
          <div className="max-h-64 overflow-y-auto px-4 pt-4 pb-2 space-y-3">
            {messages.slice(-4).map((msg) => (
              <div 
                key={msg.id} 
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`
                  max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm backdrop-blur-sm
                  ${msg.sender === 'user' 
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-zinc-700 dark:to-zinc-800 text-white rounded-br-none' 
                    : 'bg-white/60 dark:bg-white/10 dark:text-zinc-200 text-slate-800 border border-white/20 dark:border-white/5 rounded-bl-none'
                  }
                `}>
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

          {/* Input Area */}
          <div className="p-4 flex gap-2 items-center">
            <VoiceInput onTranscript={(t) => handleSend(t)} isProcessing={isProcessing} />
            
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend(inputValue)}
                placeholder="Ej: '2 residenciales y 1 poste'..."
                className="w-full bg-white/70 dark:bg-zinc-800/50 border border-white/40 dark:border-white/10 rounded-full py-3 px-4 text-sm dark:text-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all placeholder-slate-400 dark:placeholder-zinc-500"
                disabled={isProcessing}
              />
            </div>
            
            <button
              onClick={() => handleSend(inputValue)}
              disabled={!inputValue.trim() || isProcessing}
              className="p-3 bg-black dark:bg-white text-white dark:text-black rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-transform hover:scale-105 shadow-lg"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default App;