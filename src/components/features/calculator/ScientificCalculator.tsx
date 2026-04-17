
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalculatorDisplay } from '@/components/features/calculator/CalculatorDisplay';
import { CalculatorButton } from '@/components/features/calculator/CalculatorButton';
import type { CalculatorButtonConfig } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Trash2, RotateCcw } from 'lucide-react';
import { useSound } from '@/hooks/useSound';
import { useTTS } from '@/hooks/useTTS';
import { useTranslation } from '@/hooks/useTranslation';
import { ScrollArea } from '@/components/ui/scroll-area';

const LOCAL_STORAGE_HISTORY_KEY = 'nexithra-calculator-history';

export function ScientificCalculator() {
  const [visualExpression, setVisualExpression] = useState('');
  const [internalExpression, setInternalExpression] = useState('');
  const [previousCalculation, setPreviousCalculation] = useState('');
  
  const [calculationHistory, setCalculationHistory] = useState<{ expression: string, result: string }[]>([]);
  const [isRadians, setIsRadians] = useState(true); 
  const [justEvaluated, setJustEvaluated] = useState(false);

  const { playSound } = useSound('/sounds/ting.mp3', { priority: 'incidental' });
  const { speak, setVoicePreference } = useTTS();
  const { t, isReady } = useTranslation();
  
  const getCalculatorButtonsConfig = (): CalculatorButtonConfig[] => [
    { value: 'deg', label: isRadians ? t('calculator.buttons.rad') : t('calculator.buttons.deg'), type: 'action', action: 'toggleMode', className: 'bg-secondary' },
    { value: 'sin(', label: t('calculator.buttons.sin'), type: 'scientific', action: 'sin' },
    { value: 'cos(', label: t('calculator.buttons.cos'), type: 'scientific', action: 'cos' },
    { value: 'tan(', label: t('calculator.buttons.tan'), type: 'scientific', action: 'tan' },
    { value: '**', label: 'xʸ', type: 'operator' },
    { value: 'log10(', label: t('calculator.buttons.log'), type: 'scientific', action: 'log10' }, 
    { value: 'log(', label: t('calculator.buttons.ln'), type: 'scientific', action: 'log' },
    { value: 'sqrt(', label: '√', type: 'scientific', action: 'sqrt' },
    { value: 'Math.PI', label: 'π', type: 'digit', action: 'pi' },
    { value: 'Math.E', label: 'e', type: 'digit', action: 'e' }, 
    { value: '(', label: '(', type: 'operator' },
    { value: ')', label: ')', type: 'operator' },
    { value: '7', label: '7', type: 'digit' }, { value: '8', label: '8', type: 'digit' }, { value: '9', label: '9', type: 'digit' },
    { value: '/', label: '÷', type: 'operator', className: 'bg-primary/80 hover:bg-primary text-primary-foreground' },
    { value: '4', label: '4', type: 'digit' }, { value: '5', label: '5', type: 'digit' }, { value: '6', label: '6', type: 'digit' },
    { value: '*', label: '×', type: 'operator', className: 'bg-primary/80 hover:bg-primary text-primary-foreground' },
    { value: '1', label: '1', type: 'digit' }, { value: '2', label: '2', type: 'digit' }, { value: '3', label: '3', type: 'digit' },
    { value: '-', label: '−', type: 'operator', className: 'bg-primary/80 hover:bg-primary text-primary-foreground' },
    { value: '0', label: '0', type: 'digit' }, { value: '.', label: '.', type: 'decimal' },
    { value: 'AC', label: t('calculator.buttons.ac'), type: 'action', action: 'clear', className: 'bg-destructive/80 hover:bg-destructive text-destructive-foreground' },
    { value: '+', label: '+', type: 'operator', className: 'bg-primary/80 hover:bg-primary text-primary-foreground' },
    { value: '=', label: '=', type: 'equals', className: 'col-span-4 bg-accent hover:bg-accent/90 text-accent-foreground' },
  ];

  const calculatorButtonsConfig = getCalculatorButtonsConfig();

  useEffect(() => {
    setVoicePreference('gojo');
  }, [setVoicePreference]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedHistory = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
      if (storedHistory) {
        try { setCalculationHistory(JSON.parse(storedHistory)); } 
        catch (e) { console.error("Failed to parse calculator history", e); localStorage.removeItem(LOCAL_STORAGE_HISTORY_KEY); }
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(calculationHistory));
    }
  }, [calculationHistory]);

  const toRadians = (degrees: number) => degrees * (Math.PI / 180);

  const evaluateInternalExpression = (expr: string): string => {
    try {
      let exprToEval = expr;
      if (!isRadians) {
        exprToEval = exprToEval.replace(/Math\.sin\(([^)]+)\)/g, (_, p1) => `Math.sin(${toRadians(eval(p1))})`);
        exprToEval = exprToEval.replace(/Math\.cos\(([^)]+)\)/g, (_, p1) => `Math.cos(${toRadians(eval(p1))})`);
        exprToEval = exprToEval.replace(/Math\.tan\(([^)]+)\)/g, (_, p1) => `Math.tan(${toRadians(eval(p1))})`);
      }
      // eslint-disable-next-line no-eval
      let result = eval(exprToEval);
      if (typeof result === 'number' && !Number.isFinite(result)) return t('calculator.error.general');
      if (typeof result === 'number' && result.toString().length > 15) return result.toPrecision(10);
      return String(result);
    } catch (error) { return t('calculator.error.general'); }
  };

  const handleButtonClick = (value: string, type: CalculatorButtonConfig['type'], action?: string) => {
    playSound();
    if (visualExpression.startsWith(t('calculator.error.prefix'))) {
      setVisualExpression(''); setInternalExpression(''); setPreviousCalculation('');
    }
    if (justEvaluated && type !== 'operator' && type !== 'equals') {
        setVisualExpression(''); setInternalExpression(''); 
    }
    setJustEvaluated(false);

    switch (type) {
      case 'digit':
        if (action === 'pi') { setVisualExpression(p => p + 'π'); setInternalExpression(p => p + 'Math.PI'); }
        else if (action === 'e') { setVisualExpression(p => p + 'e'); setInternalExpression(p => p + 'Math.E'); }
        else { setVisualExpression(p => p + value); setInternalExpression(p => p + value); }
        break;
      case 'decimal':
        const segments = internalExpression.split(/[\+\-\*\/\(\)\^\s]/);
        const lastSegment = segments[segments.length - 1];
        if (!lastSegment.includes('.')) { setVisualExpression(p => p + '.'); setInternalExpression(p => p + '.'); }
        break;
      case 'operator':
        const lastChar = internalExpression.trim().slice(-1);
        const isOperator = ['+', '-', '*', '/', '^'].includes(lastChar);
        if (isOperator && value !== '(' && value !== ')') {
             setVisualExpression(p => p.slice(0, -1) + (calculatorButtonsConfig.find(b=>b.value===value)?.label || value) );
             setInternalExpression(p => p.slice(0, -1) + value);
        } else {
            setVisualExpression(p => p + (calculatorButtonsConfig.find(b=>b.value===value)?.label || value));
            setInternalExpression(p => p + value);
        }
        break;
      case 'equals':
        if (internalExpression) {
          const result = evaluateInternalExpression(internalExpression);
          setPreviousCalculation(visualExpression + (result.startsWith(t('calculator.error.prefix')) ? '' : ' ='));
          setVisualExpression(result); 
          setInternalExpression(result.startsWith(t('calculator.error.prefix')) ? '' : result);
          if (!result.startsWith(t('calculator.error.prefix'))) {
             setCalculationHistory(prev => [{expression: visualExpression, result}, ...prev.slice(0,4)]);
             setJustEvaluated(true);
          }
        }
        break;
      case 'action': performAction(action || value); break;
      case 'scientific':
        setVisualExpression(p => p + (calculatorButtonsConfig.find(b=>b.action===action)?.label || action) + '(');
        if (action === 'log10') setInternalExpression(p => p + 'Math.log10(');
        else if (action === 'log') setInternalExpression(p => p + 'Math.log(');
        else if (action === 'sqrt') setInternalExpression(p => p + 'Math.sqrt(');
        else setInternalExpression(p => p + `Math.${action}(`);
        break;
    }
  };

  const performAction = (action: string) => {
    switch (action) {
      case 'clear': setVisualExpression(''); setInternalExpression(''); setPreviousCalculation(''); setJustEvaluated(false); break;
      case 'toggleMode': setIsRadians(p => !p); break;
    }
  };
    
  return (
    <Card className="w-full max-w-md mx-auto shadow-lg card-bg-1 overflow-hidden">
      <CardHeader className="border-b bg-card/40 p-4">
        <CardTitle className="text-xl">{t('calculator.scientific.title')}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <CalculatorDisplay 
          mainDisplay={visualExpression} 
          historyDisplay={previousCalculation}
          mode={isRadians ? t('calculator.buttons.rad') : t('calculator.buttons.deg')}
        />
        <div className="grid grid-cols-4 gap-2">
          {calculatorButtonsConfig.map(btn => <CalculatorButton key={`${btn.label}-${btn.value}`} config={btn} onClick={handleButtonClick} isModeActive={!isRadians && btn.action === 'toggleMode'} />)}
        </div>
        
        {calculationHistory.length > 0 && (
          <div className="pt-4 border-t border-primary/10">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('calculator.history.title')}</h3>
              <Button variant="ghost" size="sm" onClick={() => setCalculationHistory([])} className="h-7 text-[10px] text-destructive hover:text-destructive/80">
                <Trash2 className="h-3 w-3 mr-1" /> {t('calculator.history.clear')}
              </Button>
            </div>
            <ScrollArea className="h-24">
                <ul className="space-y-1.5 pr-2">
                {calculationHistory.map((item, index) => (
                    <li key={index} className="flex justify-between items-center p-2 border rounded-lg bg-primary/5 text-[11px] group">
                    <button onClick={() => { setVisualExpression(item.result); setInternalExpression(item.result); setPreviousCalculation(`${item.expression} =`); setJustEvaluated(true); }} className="truncate text-left flex-1">
                        <span className="opacity-60">{item.expression} = </span> 
                        <span className="font-bold text-primary">{item.result}</span>
                    </button>
                    <Button variant="ghost" size="icon" onClick={() => setCalculationHistory(p => p.filter((_, i) => i !== index))} className="h-5 w-5 opacity-0 group-hover:opacity-100"><Trash2 className="h-3 w-3 text-destructive/70" /></Button>
                    </li>
                ))}
                </ul>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
