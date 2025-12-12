import React from 'react';

interface VoiceVisualizerProps {
  isActive: boolean;
  mode?: 'jarvis' | 'user'; // Support two modes
}

export const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({ isActive, mode = 'jarvis' }) => {
  if (!isActive) return null;

  // Colors based on who is speaking
  // Jarvis: Cyan/Violet/Pink (The original Gemini look)
  // User: Emerald/Green/Blue (Distinct input look)
  const isUser = mode === 'user';

  return (
    <div className="fixed bottom-0 left-0 right-0 h-48 z-30 pointer-events-none flex items-end justify-center overflow-hidden animate-fadeIn">
      {/* Container for fluid blobs */}
      <div className="relative w-full h-full flex items-center justify-center">
        
        {/* Central Glow */}
        <div className={`absolute w-full h-32 bottom-0 blur-xl bg-gradient-to-t ${isUser ? 'from-emerald-500/20' : 'from-cyan-500/20'} to-transparent`} />

        {/* Blob 1 */}
        <div className={`absolute bottom-[-20%] w-48 h-48 rounded-full mix-blend-screen filter blur-[60px] opacity-70 animate-blob ${isUser ? 'bg-emerald-500' : 'bg-cyan-500'}`} />
        
        {/* Blob 2 */}
        <div className={`absolute bottom-[-20%] left-[20%] w-48 h-48 rounded-full mix-blend-screen filter blur-[60px] opacity-70 animate-blob ${isUser ? 'bg-green-500' : 'bg-violet-500'}`} style={{ animationDelay: '2s' }} />
        
        {/* Blob 3 */}
        <div className={`absolute bottom-[-20%] right-[20%] w-48 h-48 rounded-full mix-blend-screen filter blur-[60px] opacity-60 animate-blob ${isUser ? 'bg-teal-500' : 'bg-pink-500'}`} style={{ animationDelay: '4s' }} />

        {/* Waveform Bars (Simulated) */}
        <div className="absolute bottom-10 flex gap-1 items-end h-16 opacity-80">
          <div className="w-1.5 bg-white/80 rounded-full animate-wave" style={{ animationDuration: '0.8s' }}></div>
          <div className="w-1.5 bg-white/80 rounded-full animate-wave" style={{ animationDuration: '1.2s' }}></div>
          <div className="w-1.5 bg-white/80 rounded-full animate-wave" style={{ animationDuration: '0.9s' }}></div>
          <div className="w-1.5 bg-white/80 rounded-full animate-wave" style={{ animationDuration: '1.5s' }}></div>
        </div>
      </div>
    </div>
  );
};