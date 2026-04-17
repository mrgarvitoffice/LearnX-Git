
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSettings } from '@/contexts/SettingsContext';

/**
 * A highly robust recursive translation hook for LearnX.
 * Resolves nested keys (e.g. "a.b.c") and handles dynamic imports correctly.
 */

type TFunction = (key: string, options?: { [key: string]: string | number }) => string;

interface TranslationState {
  translations: any | null;
  isReady: boolean;
}

const localeLoaders: Record<string, () => Promise<any>> = {
  en: () => import('@/app/locales/en.json'),
  hi: () => import('@/app/locales/hi.json'),
};

export function useTranslation(): { t: TFunction, isReady: boolean } {
  const { appLanguage } = useSettings();
  const [state, setState] = useState<TranslationState>({
    translations: null,
    isReady: false,
  });

  useEffect(() => {
    let isMounted = true;
    const langCode = appLanguage?.split('-')[0] || 'en';
    
    const loadTranslations = async () => {
      const loader = localeLoaders[langCode as keyof typeof localeLoaders] || localeLoaders.en;

      try {
        const module = await loader();
        if (isMounted) {
          setState({ 
            translations: module.default || module, 
            isReady: true 
          });
        }
      } catch (error) {
        console.warn(`[Translation System] Load failed for: "${langCode}". Falling back to English.`, error);
        try {
          const fallback = await localeLoaders.en();
          if (isMounted) {
            setState({ translations: fallback.default || fallback, isReady: true });
          }
        } catch (e) {
          if (isMounted) setState({ translations: {}, isReady: true });
        }
      }
    };
    
    loadTranslations();
    return () => { isMounted = false; };
  }, [appLanguage]);

  const t: TFunction = useCallback((key, options) => {
    if (!state.isReady || !state.translations) return key;

    // Recursive path traversal to find nested keys (e.g., "dashboard.welcome")
    const keys = key.split('.');
    let result: any = state.translations;

    for (const k of keys) {
      if (result && typeof result === 'object' && k in result) {
        result = result[k];
      } else {
        result = undefined;
        break;
      }
    }

    // Fallback logic if the key was not found in the object tree
    if (result === undefined || result === null || typeof result !== 'string') {
        if (state.translations[key] && typeof state.translations[key] === 'string') {
            result = state.translations[key];
        } else {
            return key; // Return raw key as absolute last resort
        }
    }

    let val = result;
    if (options) {
      Object.keys(options).forEach(optKey => {
        val = val.replace(new RegExp(`{{${optKey}}}`, 'g'), String(options[optKey]));
      });
    }

    return val;
  }, [state.translations, state.isReady]);

  return { t, isReady: state.isReady && !!state.translations };
}
