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
      // Cancel previous speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      
      // Try to find a good Spanish voice
      const voices = window.speechSynthesis.getVoices();
      const spanishVoice = voices.find(v => v.lang.includes('es') && v.name.includes('Google'));
      if (spanishVoice) utterance.voice = spanishVoice;

      window.speechSynthesis.speak(utterance);
    }
  };

  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    // Refresh records if prices changed? 
    // Ideally historical records keep their price, but new ones use new price.
    // However, Dashboard needs to re-render if something changed globally, saving state triggers re-render.
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
    <div className="min-h-screen dark:bg-slate-900 bg-slate-100 dark:text-slate-200 text-slate-800 font-rajdhani relative overflow-hidden transition-colors duration-300">
      
      {/* Background Tech Effects - Only visible in dark mode primarily or subtle in light */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500/0 via-cyan-500/50 to-cyan-500/0 opacity-50 dark:opacity-100" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl opacity-50 dark:opacity-100" />
        <div className="absolute top-20 left-10 w-32 h-32 bg-violet-500/5 rounded-full blur-2xl opacity-50 dark:opacity-100" />
      </div>

      {/* Header */}
      <nav className="fixed top-0 w-full dark:bg-slate-900/80 bg-white/80 backdrop-blur-md border-b dark:border-slate-700 border-slate-200 z-50 h-16 flex items-center justify-between px-4 transition-colors">
        <div className="flex items-center gap-2" onClick={() => navigateTo('dashboard')}>
          <div className="w-8 h-8 rounded bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
            <Bot size={20} />
          </div>
          <h1 className="text-xl font-bold tracking-widest dark:text-white text-slate-900">JARVIS<span className="text-cyan-500 dark:text-cyan-400">.NETUNO</span></h1>
        </div>
        <div className="flex items-center gap-2">
           {/* Widget Toggle Button */}
          <button 
            onClick={() => setIsWidgetOpen(true)}
            className="p-2 text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-white transition-colors dark:bg-cyan-900/30 bg-cyan-50 rounded border dark:border-cyan-500/30 border-cyan-200"
            title="Abrir Widget Rápido"
          >
            <LayoutGrid size={20} />
          </button>
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`p-2 transition-colors ${isMenuOpen ? 'dark:text-white text-slate-900 dark:bg-slate-700 bg-slate-200 rounded' : 'dark:text-slate-400 text-slate-600 hover:text-slate-900 dark:hover:text-white'}`}
          >
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* Navigation Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed top-16 right-0 w-64 dark:bg-slate-900/95 bg-white/95 border-l dark:border-slate-700 border-slate-200 border-b rounded-bl-2xl z-[60] shadow-2xl animate-fadeIn p-4 backdrop-blur-xl">
           <div className="flex flex-col gap-3">
              <span className="text-xs dark:text-slate-500 text-slate-400 font-bold tracking-widest uppercase mb-1">Navegación</span>
              <button 
                onClick={() => navigateTo('dashboard')}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${currentView === 'dashboard' ? 'dark:bg-cyan-900/40 bg-cyan-50 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30' : 'hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-300 text-slate-700'}`}
              >
                <LayoutDashboard size={20} />
                <span className="font-bold">Panel Principal</span>
              </button>
              <button 
                onClick={() => navigateTo('history')}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${currentView === 'history' ? 'dark:bg-cyan-900/40 bg-cyan-50 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30' : 'hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-300 text-slate-700'}`}
              >
                <List size={20} />
                <span className="font-bold">Historial Detallado</span>
              </button>
              <button 
                onClick={() => navigateTo('settings')}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${currentView === 'settings' ? 'dark:bg-cyan-900/40 bg-cyan-50 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30' : 'hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-300 text-slate-700'}`}
              >
                <SettingsIcon size={20} />
                <span className="font-bold">Configuración</span>
              </button>

              <div className="h-px dark:bg-slate-800 bg-slate-200 my-2" />
              
              <button 
                onClick={handleInstallClick}
                className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-cyan-900 to-slate-900 dark:from-cyan-900 dark:to-slate-900 from-cyan-600 to-slate-700 border border-cyan-500/30 text-white hover:opacity-90 transition-all shadow-lg"
              >
                {isIOS ? <Share size={20} /> : <Download size={20} />}
                <span className="font-bold">INSTALAR APP</span>
              </button>
              
              <div className="mt-4 text-center text-xs dark:text-slate-600 text-slate-400">
                Netuno Jarvis v1.4
              </div>
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
        title="ELIMINAR REGISTRO"
        message="¿Estás seguro de que deseas eliminar este registro? Esta acción no se puede deshacer."
      />

      {/* Main Content Area */}
      <main className="pt-24 px-4 pb-48 max-w-2xl mx-auto z-10 relative min-h-screen">
        {currentView === 'dashboard' && <Dashboard records={records} />}
        {currentView === 'history' && <HistoryView records={records} onDelete={handleRequestDelete} />}
        {currentView === 'settings' && <SettingsView settings={settings} onSave={handleUpdateSettings} />}
      </main>

      {/* Sticky Chat Interface (Hide on settings page if desired, but kept for consistency) */}
      <div className={`fixed bottom-0 w-full z-40 dark:bg-slate-900 bg-white border-t dark:border-slate-700 border-slate-200 shadow-[0_-5px_20px_rgba(0,0,0,0.1)] dark:shadow-[0_-5px_20px_rgba(0,0,0,0.5)] transition-transform duration-300 ${currentView === 'settings' ? 'translate-y-full' : 'translate-y-0'}`}>
        <div className="max-w-2xl mx-auto">
          {/* Chat History Overlay */}
          <div className="max-h-64 overflow-y-auto px-4 pt-4 pb-2 space-y-3">
            {messages.slice(-4).map((msg) => (
              <div 
                key={msg.id} 
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`
                  max-w-[85%] rounded-lg p-2 text-sm
                  ${msg.sender === 'user' 
                    ? 'bg-slate-700 dark:bg-slate-700 text-white rounded-br-none' 
                    : 'dark:bg-cyan-900/30 bg-cyan-100 text-cyan-900 dark:text-cyan-100 border dark:border-cyan-500/30 border-cyan-200 rounded-bl-none shadow-sm'
                  }
                `}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="flex justify-start">
                <div className="dark:bg-cyan-900/30 bg-cyan-50 text-cyan-600 dark:text-cyan-400 border dark:border-cyan-500/30 border-cyan-200 rounded-lg p-2 text-xs flex items-center gap-2">
                  <div className="w-1.5 h-1.5 dark:bg-cyan-400 bg-cyan-600 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 dark:bg-cyan-400 bg-cyan-600 rounded-full animate-bounce delay-75" />
                  <div className="w-1.5 h-1.5 dark:bg-cyan-400 bg-cyan-600 rounded-full animate-bounce delay-150" />
                  PROCESANDO
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 flex gap-2 items-center dark:bg-slate-900/90 bg-white/90 backdrop-blur">
            <VoiceInput onTranscript={(t) => handleSend(t)} isProcessing={isProcessing} />
            
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend(inputValue)}
                placeholder="Ej: '2 residenciales y 1 poste'..."
                className="w-full dark:bg-slate-800 bg-slate-100 border dark:border-slate-600 border-slate-300 rounded-full py-3 px-4 text-sm dark:text-white text-slate-900 focus:outline-none focus:border-cyan-500 transition-colors placeholder-slate-400 dark:placeholder-slate-500"
                disabled={isProcessing}
              />
            </div>
            
            <button
              onClick={() => handleSend(inputValue)}
              disabled={!inputValue.trim() || isProcessing}
              className="p-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-cyan-500/20"
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