
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTTS } from '@/hooks/useTTS';
import { useToast } from './use-toast';
import { useSettings } from '@/contexts/SettingsContext';

export type AssistantStatus = 'idle' | 'listening' | 'processing' | 'speaking' | 'awaiting_command';

interface AssistantVoiceProps {
  onCommand: (command: string) => Promise<{ verbalResponse: string, action: () => void } | undefined>;
  onTranscriptUpdate?: (transcript: string, isFinal: boolean) => void;
}

export function useAssistantVoice({ onCommand, onTranscriptUpdate }: AssistantVoiceProps) {
  const [isAssistantActive, setIsAssistantActive] = useState(false);
  const [status, setStatus] = useState<AssistantStatus>('idle');
  const [browserSupportsSpeechRecognition, setBrowserSupportsSpeechRecognition] = useState(false);
  
  const { mode } = useSettings();
  const { speak, cancelTTS, setVoicePreference } = useTTS();
  const { toast } = useToast();
  
  const recognitionRef = useRef<any>(null);
  const isStoppingManuallyRef = useRef(false);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setBrowserSupportsSpeechRecognition(
      typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    );
  }, []);

  const processAndRespond = useCallback(async (transcript: string) => {
    const normalized = transcript.toLowerCase().trim();
    if (!normalized) return;

    // IRON MAN WAKE WORD PROTOCOL
    const wakeWords = ['jarvis', 'alya', 'alia'];
    const hasWakeWord = wakeWords.some(w => normalized.startsWith(w));
    const isOnlyWakeWord = wakeWords.some(w => normalized === w);

    if (isOnlyWakeWord) {
      setStatus('awaiting_command');
      const wakeResponse = mode === 'jarvis' ? "Yes sir, how may I assist you?" : "Yes, how can I help?";
      speak(wakeResponse, {
        priority: 'manual',
        onEnd: () => {
          if (isAssistantActive) setStatus('listening');
        }
      });
      return;
    }

    // COMMAND HANDLING
    if (hasWakeWord || status === 'listening') {
        setStatus('processing');
        try {
          // Remove the wake word from the command if present
          const cleanCommand = normalized.replace(/^(jarvis|alya|alia)[,\s]*/, '');
          const result = await onCommand(cleanCommand || normalized);
          
          if (result) {
            setStatus('speaking');
            speak(result.verbalResponse, {
              priority: 'manual',
              onEnd: () => {
                result.action();
                if (isAssistantActive) setStatus('listening');
                else setStatus('idle');
              },
            });
          } else {
            setStatus('listening');
          }
        } catch (err) {
          console.error("[J.A.R.V.I.S. Core] Processing error:", err);
          setStatus('listening');
        }
    }
  }, [onCommand, speak, isAssistantActive, mode, status]);

  const startRecognition = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition || !isAssistantActive) return;

    recognition.onstart = () => {
      setStatus('listening');
      isStoppingManuallyRef.current = false;
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'not-allowed') {
        setIsAssistantActive(false);
        toast({ 
          title: 'Neural Link Interrupted', 
          description: 'Microphone access is required for J.A.R.V.I.S. activation.', 
          variant: 'destructive' 
        });
      }
    };
    
    recognition.onend = () => {
      if (isAssistantActive && !isStoppingManuallyRef.current) {
        try { recognition.start(); } catch (e) {}
      } else {
        setStatus('idle');
      }
    };
    
    recognition.onresult = (event: any) => {
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);

      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const displayTranscript = finalTranscript || interimTranscript;
      if (displayTranscript) {
        onTranscriptUpdate?.(displayTranscript, !!finalTranscript);
      }

      if (finalTranscript) {
        // High-fidelity debounce for natural speech flow
        silenceTimeoutRef.current = setTimeout(() => {
          processAndRespond(finalTranscript);
        }, 1200);
      }
    };
    
    try {
      recognition.start();
    } catch (e) {}
  }, [isAssistantActive, processAndRespond, onTranscriptUpdate, toast]);

  useEffect(() => {
    if (browserSupportsSpeechRecognition) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      return () => {
        if (recognitionRef.current) recognitionRef.current.abort();
      };
    }
  }, [browserSupportsSpeechRecognition]);

  const toggleAssistant = useCallback(() => {
    setIsAssistantActive(prev => {
      const nextState = !prev;
      if (nextState) {
        isStoppingManuallyRef.current = false;
        setVoicePreference('jarvis');
      } else {
        isStoppingManuallyRef.current = true;
        if (recognitionRef.current) recognitionRef.current.stop();
        cancelTTS();
        setStatus('idle');
      }
      return nextState;
    });
  }, [cancelTTS, setVoicePreference]);

  useEffect(() => {
    if (isAssistantActive) startRecognition();
  }, [isAssistantActive, startRecognition]);
  
  return { status, toggleAssistant, browserSupportsSpeechRecognition, isAssistantActive };
}
