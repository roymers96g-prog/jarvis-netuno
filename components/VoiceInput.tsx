import React, { useState, useRef } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  isProcessing: boolean;
  onStateChange?: (isListening: boolean) => void;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({ onTranscript, isProcessing, onStateChange }) => {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Helper to notify parent of state changes
  const updateListeningState = (state: boolean) => {
    setListening(state);
    if (onStateChange) onStateChange(state);
  };

  const startListening = () => {
    // Browser compatibility check
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Tu navegador no soporta reconocimiento de voz nativo.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'es-ES'; 
      recognition.continuous = false; 
      recognition.interimResults = false; // Simplified for robustness

      recognition.onstart = () => {
        updateListeningState(true);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech Recognition Error:", event.error);
        if (event.error === 'not-allowed') {
          alert("Permiso de micrófono denegado.");
        }
        updateListeningState(false);
      };

      recognition.onend = () => {
        updateListeningState(false);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          onTranscript(transcript);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();

    } catch (error) {
      console.error("Failed to start recognition:", error);
      alert("Error al iniciar micrófono.");
      updateListeningState(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error("Error stopping", e);
      }
      updateListeningState(false);
    }
  };

  const toggleListening = () => {
    if (listening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <button
      onClick={toggleListening}
      disabled={isProcessing}
      className={`
        p-3 rounded-full transition-all duration-300 relative shadow-lg
        ${listening 
          ? 'bg-red-500 text-white animate-pulse shadow-red-500/50' 
          : 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white border border-white/10 hover:scale-105 shadow-cyan-500/30'
        }
        ${isProcessing ? 'opacity-50 cursor-not-allowed bg-slate-600' : ''}
      `}
      title={listening ? "Detener" : "Hablar con Jarvis"}
    >
      {isProcessing ? (
        <Loader2 size={20} className="animate-spin" />
      ) : listening ? (
        <MicOff size={20} />
      ) : (
        <Mic size={20} />
      )}
      
      {listening && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
        </span>
      )}
    </button>
  );
};