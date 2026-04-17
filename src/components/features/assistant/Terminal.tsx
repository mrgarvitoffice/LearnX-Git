
"use client";

import { useAssistant } from '@/contexts/AssistantContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const Terminal = () => {
  const {
    isTerminalOpen,
    toggleTerminal,
    terminalContent,
    processCommand,
  } = useAssistant();

  const [input, setInput] = useState('');
  const [isMaximized, setIsMaximized] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isTerminalOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isTerminalOpen]);
  
  useEffect(() => {
    if (terminalRef.current) {
      const viewport = terminalRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) viewport.scrollTop = viewport.scrollHeight;
    }
  }, [terminalContent]);

  const handleTerminalInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault();
      processCommand(input);
      setInput('');
    }
  };

  return (
    <AnimatePresence>
      {isTerminalOpen && (
        <motion.div
          initial={{ y: 20, opacity: 0, scale: 0.95 }}
          animate={{ 
            y: 0, 
            opacity: 1, 
            scale: 1,
            width: isMaximized ? 'min(95vw, 800px)' : 'min(95vw, 400px)',
            height: isMaximized ? 'min(80vh, 600px)' : 'min(40vh, 300px)'
          }}
          exit={{ y: 20, opacity: 0, scale: 0.95 }}
          className="fixed bottom-24 sm:bottom-20 right-2 sm:right-6 z-[70] bg-[#0a0a0c]/95 backdrop-blur-2xl border border-primary/20 shadow-2xl flex flex-col rounded-xl overflow-hidden"
        >
          {/* Terminal Header */}
          <div className="bg-primary/5 px-4 py-2.5 flex justify-between items-center border-b border-primary/10">
            <div className="flex items-center gap-3">
              <div className="flex space-x-1.5">
                <div className="w-2 h-2 bg-red-500/80 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-yellow-500/80 rounded-full"></div>
                <div className="w-2 h-2 bg-green-500/80 rounded-full"></div>
              </div>
              <h3 className="font-mono text-[10px] font-black uppercase tracking-widest text-primary/80">J.A.R.V.I.S. DATA_LOG</h3>
            </div>
            <div className="flex items-center gap-2">
                <button className="text-muted-foreground hover:text-primary transition-colors" onClick={() => setIsMaximized(!isMaximized)}>
                   {isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </button>
                <button className="text-muted-foreground hover:text-destructive transition-colors" onClick={toggleTerminal}>
                    <X size={14} />
                </button>
            </div>
          </div>

          {/* Terminal Log Area */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full w-full" ref={terminalRef}>
                <div className="p-4 font-mono text-[11px] space-y-2.5">
                    {terminalContent.length === 0 && (
                        <div className="text-muted-foreground italic opacity-50 uppercase text-[9px] tracking-tighter">System online. Listening for wake protocol...</div>
                    )}
                    {terminalContent.map((item) => (
                    <div
                        key={item.id}
                        className={cn(
                            "leading-relaxed break-words",
                            item.type === 'user' ? 'text-blue-400' : 
                            item.type === 'ai' ? 'text-emerald-400 font-bold' : 
                            item.type === 'error' ? 'text-red-400' : 'text-primary/60'
                        )}
                    >
                        <span className="opacity-40 mr-1.5">[{new Date(item.id).toLocaleTimeString([], { hour12: false })}]</span>
                        {item.type === 'user' ? 'USER_CMD> ' : 'JARVIS_LOG> '}
                        {item.content}
                    </div>
                    ))}
                </div>
            </ScrollArea>
          </div>

          {/* Terminal Command Input */}
          <div className="p-3 bg-black/40 border-t border-primary/10 flex items-center gap-2.5">
            <span className="text-[10px] font-bold text-primary animate-pulse flex-shrink-0">SYS$</span>
            <input
              ref={inputRef}
              type="text"
              className="flex-1 bg-transparent border-none outline-none text-gray-200 font-mono text-[11px] placeholder:text-muted-foreground/30"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleTerminalInput}
              placeholder="MANUAL_COMMAND_ENTRY"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Terminal;
