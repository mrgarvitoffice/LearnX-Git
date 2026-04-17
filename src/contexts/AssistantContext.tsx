
"use client";

import React, { createContext, useState, useContext, useEffect, useCallback, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { processAssistantCommand, type AssistantCommandOutput } from '@/ai/flows/jarvis-command';
import { useAuth } from '@/contexts/AuthContext';
import { useAssistantVoice, type AssistantStatus } from '@/hooks/useAssistantVoice';
import { useSettings } from './SettingsContext';
import { APP_LANGUAGES } from '@/lib/constants';
import { useTTS } from '@/hooks/useTTS';

interface TerminalMessage {
  id: number;
  content: string;
  type: 'user' | 'ai' | 'system' | 'error';
}

interface AssistantContextType {
  isTerminalOpen: boolean;
  status: AssistantStatus;
  isAssistantActive: boolean;
  terminalContent: TerminalMessage[];
  toggleAssistant: () => void;
  toggleTerminal: () => void;
  processCommand: (command: string) => Promise<void>;
  addToTerminal: (message: string, type: TerminalMessage['type']) => void;
  browserSupportsSpeechRecognition: boolean;
}

const AssistantContext = createContext<AssistantContextType | undefined>(undefined);

export function AssistantProvider({ children }: { children: ReactNode }) {
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [terminalContent, setTerminalContent] = useState<TerminalMessage[]>([]);
  
  const { signOutUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { appLanguage, userGoal } = useSettings();
  const { speak, cancelTTS } = useTTS();

  const addToTerminal = useCallback((content: string, type: TerminalMessage['type']) => {
    setTerminalContent(prev => [...prev, { id: Date.now(), content, type }]);
  }, []);

  const toggleTerminal = useCallback(() => {
    setIsTerminalOpen(prev => !prev);
  }, []);

  const executeAction = useCallback((action: AssistantCommandOutput) => {
    switch (action.action) {
      case 'navigate':
        if (action.params?.target) router.push(action.params.target);
        break;
      case 'generate_notes':
        if (action.params?.topic) {
          router.push(`/notes?topic=${encodeURIComponent(action.params.topic)}`);
        }
        break;
      case 'logout':
        signOutUser();
        break;
      case 'open_terminal':
        setIsTerminalOpen(true);
        break;
      case 'close_terminal':
        setIsTerminalOpen(false);
        break;
      default:
        break;
    }
  }, [router, signOutUser]);

  const processCommandFromSource = useCallback(async (command: string): Promise<{ verbalResponse: string, action: () => void } | undefined> => {
    if (!command.trim()) return;

    addToTerminal(command, 'user');
    
    try {
      const languageInfo = APP_LANGUAGES.find(l => l.value === appLanguage);
      const languageName = languageInfo?.englishName || 'English';

      const response = await processAssistantCommand({ 
          command, 
          context: pathname, 
          mode: 'jarvis', 
          language: languageName, 
          userGoal: userGoal || undefined 
      });
      
      const verbalResponse = response.verbal_response || 'Acknowledged.';
      addToTerminal(verbalResponse, 'ai');

      return { verbalResponse, action: () => executeAction(response) };

    } catch (error: any) {
      addToTerminal(error.message || "Neural core logic error.", 'error');
      return { verbalResponse: "I've encountered a logic block, sir.", action: () => {} };
    }
  }, [pathname, appLanguage, userGoal, addToTerminal, executeAction]);

  const { status, toggleAssistant, browserSupportsSpeechRecognition, isAssistantActive } = useAssistantVoice({
    onCommand: processCommandFromSource
  });

  const processCommandForUi = useCallback(async (cmd: string) => {
      cancelTTS();
      const result = await processCommandFromSource(cmd);
      if (result) {
          speak(result.verbalResponse, { priority: 'manual' });
          result.action();
      }
  }, [processCommandFromSource, speak, cancelTTS]);

  useEffect(() => {
    if (isAssistantActive) {
      setIsTerminalOpen(true);
      addToTerminal("Neural Link Established. System standing by.", "system");
    } else {
      setIsTerminalOpen(false);
      setTerminalContent([]);
    }
  }, [isAssistantActive, addToTerminal]);

  return (
    <AssistantContext.Provider value={{
      isTerminalOpen, status, isAssistantActive,
      terminalContent,
      toggleAssistant, toggleTerminal,
      processCommand: processCommandForUi,
      addToTerminal,
      browserSupportsSpeechRecognition,
    }}>
      {children}
    </AssistantContext.Provider>
  );
}

export function useAssistant() {
  const context = useContext(AssistantContext);
  if (context === undefined) throw new Error('useAssistant must be used within an AssistantProvider');
  return context;
}
