import React, { useState, useRef, useEffect } from 'react';
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
      alert("Tu navegador no soporta reconocimiento de voz. Por favor usa Google Chrome.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'es-ES'; // Default Spanish
      recognition.continuous = false; // Changed to false for better mobile stability (Auto-stop on silence)
      recognition.interimResults = true; // We want to see results as they come

      recognition.onstart = () => {
        updateListeningState(true);
      };

      recognition.onresult = (event: any) => {
        // Just grab the latest transcript
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript;
        
        // Optional: We could update a preview here if we wanted
      };

      recognition.onerror = (event: any) => {
        console.error("Speech Recognition Error:", event.error);
        if (event.error === 'not-allowed') {
          alert("Permiso de micrófono denegado. Habilítalo en la configuración del navegador.");
        }
        if (event.error !== 'no-speech') {
           // Don't alert on 'no-speech' as it happens frequently on silence
           updateListeningState(false);
        }
      };

      recognition.onend = () => {
        updateListeningState(false);
      };

      // Custom property to accumulate final text if continuous was true, 
      // but with continuous=false we just grab the result in onend or handle the specific result event.
      // For this implementation (One command at a time):
      recognition.onresult = (event: any) => {
          const lastResult = event.results[event.results.length - 1];
          if (lastResult.isFinal) {
              const text = lastResult[0].transcript.trim();
              if (text) {
                  onTranscript(text);
              }
          }
      };

      recognitionRef.current = recognition;
      recognition.start();

    } catch (error) {
      console.error("Failed to start recognition:", error);
      alert("Error al iniciar el micrófono. Intenta recargar la página.");
      updateListeningState(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
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