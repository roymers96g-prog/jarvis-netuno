import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { VoiceInput } from './VoiceInput';

interface ChatBarProps {
  onSendMessage: (text: string) => void;
  isProcessing: boolean;
  onVoiceStateChange: (isSpeaking: boolean) => void;
}

export const ChatBar: React.FC<ChatBarProps> = ({ onSendMessage, isProcessing, onVoiceStateChange }) => {
  const [inputValue, setInputValue] = useState('');

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text || isProcessing) return;
    onSendMessage(text);
    setInputValue('');
  };

  const handleVoiceSend = (text: string) => {
    if (!text.trim() || isProcessing) return;
    onSendMessage(text.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4 flex gap-2 items-center">
      <VoiceInput 
        onTranscript={handleVoiceSend} 
        isProcessing={isProcessing} 
        onStateChange={onVoiceStateChange} 
      />
      <div className="flex-1 relative">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ej: '2 residenciales y 1 poste'..."
          className="w-full bg-white/70 dark:bg-zinc-800/50 border border-white/40 dark:border-white/10 rounded-full py-3 px-4 text-sm dark:text-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-500"
          disabled={isProcessing}
        />
      </div>
      <button
        onClick={handleSend}
        disabled={!inputValue.trim() || isProcessing}
        className="p-3 bg-black dark:bg-white text-white dark:text-black rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-transform hover:scale-105 shadow-lg"
      >
        <Send size={20} />
      </button>
    </div>
  );
};
