
"use client";

import { useAssistant } from '@/contexts/AssistantContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Loader2, Zap, Terminal as TerminalIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSound } from '@/hooks/useSound';
import { Button } from '@/components/ui/button';
import Terminal from './Terminal';

const Assistant = () => {
  const { toggleAssistant, status, isAssistantActive, browserSupportsSpeechRecognition, isTerminalOpen, toggleTerminal } = useAssistant();
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', { priority: 'essential' });

  const handleToggle = () => {
    playClickSound();
    toggleAssistant();
  };
  
  const getReactorColor = () => {
    if (!isAssistantActive) return 'border-primary/20 bg-primary/5';
    if (status === 'listening') return 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.6)] bg-blue-500/20';
    if (status === 'awaiting_command') return 'border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.8)] bg-yellow-500/20';
    if (status === 'processing') return 'border-white shadow-[0_0_15px_rgba(255,255,255,0.6)] bg-white/20';
    if (status === 'speaking') return 'border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.6)] bg-purple-500/20';
    return 'border-blue-400 bg-blue-400/10';
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleToggle}
        disabled={!browserSupportsSpeechRecognition}
        className={cn(
          "h-9 w-9 rounded-full border-2 transition-all duration-500 flex items-center justify-center group overflow-hidden relative",
          getReactorColor()
        )}
        title={isAssistantActive ? "Deactivate Jarvis" : "Activate Jarvis"}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.2)_100%)]" />
        
        {status === 'processing' ? (
          <Loader2 className="h-4 w-4 text-white animate-spin relative z-10" />
        ) : status === 'speaking' ? (
          <Brain className="h-4 w-4 text-purple-400 animate-pulse relative z-10" />
        ) : status === 'awaiting_command' ? (
          <Zap className="h-4 w-4 text-yellow-400 animate-bounce relative z-10" />
        ) : (
          <div className={cn(
            "h-3 w-3 rounded-full border transition-colors duration-500",
            isAssistantActive ? "bg-white/80 border-white shadow-[0_0_10px_white]" : "bg-primary/40 border-primary"
          )} />
        )}

        <div className="absolute inset-0 opacity-10 group-hover:opacity-30 transition-opacity">
            {[...Array(8)].map((_, i) => (
                <div key={i} className="absolute top-1/2 left-1/2 w-full h-[0.5px] bg-white" style={{ transform: `translate(-50%, -50%) rotate(${i * 45}deg)` }} />
            ))}
        </div>
      </button>

      <AnimatePresence>
        {isAssistantActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <Button
              variant="outline"
              size="icon"
              className={cn(
                "h-9 w-9 rounded-full border-primary/20",
                isTerminalOpen && "bg-primary/10 border-primary"
              )}
              onClick={() => { playClickSound(); toggleTerminal(); }}
              title="Jarvis Terminal"
            >
              <TerminalIcon className={cn("h-4 w-4", isTerminalOpen ? "text-primary" : "text-muted-foreground")} />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAssistantActive && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-2 left-1/2 -translate-x-1/2 z-[60] bg-black/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-primary/30 flex items-center gap-3 shadow-2xl pointer-events-none"
          >
            <div className={cn("h-2 w-2 rounded-full", status === 'listening' ? 'bg-blue-500 animate-pulse' : 'bg-primary')} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                {status === 'listening' ? 'Neural Link Standby' : status === 'awaiting_command' ? 'Awaiting Protocol' : status === 'processing' ? 'Thinking...' : 'Jarvis Online'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Assistant;
