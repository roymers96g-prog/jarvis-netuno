import React, { useState, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  isProcessing: boolean;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({ onTranscript, isProcessing }) => {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const transcriptBuffer = useRef<string>("");

  // Web Speech API check
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  const toggleListening = () => {
    if (!SpeechRecognition) {
      alert("Tu navegador no soporta reconocimiento de voz. Usa Chrome o Safari.");
      return;
    }

    if (listening) {
      // User manually stops recording
      recognitionRef.current?.stop();
    } else {
      startListening();
    }
  };

  const startListening = () => {
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = true; // Enable continuous recording
    recognition.interimResults = true; // Capture interim results to keep stream active

    recognition.onstart = () => {
      setListening(true);
      transcriptBuffer.current = ""; // Reset buffer
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      
      // SpeechRecognition with continuous=true returns a list of results.
      // We must reconstruct the full sentence from the array.
      for (let i = 0; i < event.results.length; ++i) {
        finalTranscript += event.results[i][0].transcript;
      }
      
      transcriptBuffer.current = finalTranscript;
    };

    recognition.onerror = (event: any) => {
      console.error("Speech Recognition Error:", event.error);
      // If no speech was detected, just stop.
      if (event.error === 'no-speech') {
        setListening(false);
      }
    };

    recognition.onend = () => {
      setListening(false);
      // Send the accumulated text when recording stops (either manual or auto-stop)
      if (transcriptBuffer.current.trim()) {
        onTranscript(transcriptBuffer.current.trim());
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  return (
    <button
      onClick={toggleListening}
      disabled={isProcessing}
      className={`
        p-3 rounded-full transition-all duration-300 relative
        ${listening 
          ? 'bg-red-500/20 text-red-400 border border-red-500 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]' 
          : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20'
        }
        ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      title={listening ? "Detener grabación" : "Iniciar grabación de voz"}
    >
      {listening ? <MicOff size={20} /> : <Mic size={20} />}
      
      {/* Visual indicator for active recording state */}
      {listening && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
        </span>
      )}
    </button>
  );
};