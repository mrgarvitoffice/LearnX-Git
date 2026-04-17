"use client";

import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { COLLEGE_DATA, GOAL_CARDS_DATA, NEWS_COUNTRIES, APP_LANGUAGES } from '@/lib/constants';
import type { UserGoal, GoalType } from '@/lib/types';
import { useSettings } from '@/contexts/SettingsContext';
import { useToast } from '@/hooks/use-toast';
import type { LucideIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTranslation } from '@/hooks/useTranslation';
import { Switch } from '@/components/ui/switch';

interface GoalSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface GoalCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  goalType: GoalType;
  isSelected: boolean;
  onSelect: (type: GoalType) => void;
}

const GoalCard = ({ icon: Icon, title, description, goalType, isSelected, onSelect }: GoalCardProps) => (
    <motion.div whileHover={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }}>
      <Card
        className={cn(
          "text-left p-4 cursor-pointer hover:shadow-primary/20 transition-all flex items-start gap-4 h-full relative overflow-hidden group",
          isSelected && "ring-2 ring-primary bg-primary/5"
        )}
        onClick={() => onSelect(goalType)}
      >
        <Icon className="h-8 w-8 text-primary mt-1 shrink-0" />
        <div>
            <h4 className="font-semibold text-base">{title}</h4>
            <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>
        </div>
      </Card>
    </motion.div>
  );


export function GoalSelectionDialog({ isOpen, onClose }: GoalSelectionDialogProps) {
  const { userGoal, setUserGoal } = useSettings();
  const { toast } = useToast();
  const { t, isReady } = useTranslation();

  const [step, setStep] = useState(1);
  const [selectedCountry, setSelectedCountry] = useState(userGoal?.country || 'us');
  const [selectedGoal, setSelectedGoal] = useState<GoalType | null>(userGoal?.type || null);
  
  const [university, setUniversity] = useState(userGoal?.type === 'college' ? userGoal.university || '' : '');
  const [program, setProgram] = useState(userGoal?.type === 'college' ? userGoal.program || '' : '');
  const [branch, setBranch] = useState(userGoal?.type === 'college' ? userGoal.branch || '' : '');
  const [semester, setSemester] = useState(userGoal?.type === 'college' ? userGoal.semester || '' : '');

  // Step 2 Questions
  const [happyState, setHappyState] = useState('');
  const [aiLove, setAiLove] = useState(true);

  useEffect(() => {
    if (isOpen) {
        setStep(1);
        setSelectedCountry(userGoal?.country || 'us');
        setSelectedGoal(userGoal?.type || null);
        if (userGoal?.type === 'college') {
            setUniversity(userGoal.university || '');
            setProgram(userGoal.program || '');
            setBranch(userGoal.branch || '');
            setSemester(userGoal.semester || '');
        }
    }
  }, [isOpen, userGoal]);

  const handleSaveGoal = () => {
    let goalData: UserGoal;
    
    switch(selectedGoal) {
        case 'college':
            if (!university || !program || !branch || !semester) {
                toast({ title: "Incomplete Selection", description: "Please select all college options.", variant: "destructive" });
                return;
            }
            goalData = { type: 'college', country: selectedCountry, university, program, branch, semester };
            break;
        case null:
             toast({ title: "No Goal Selected", description: "Please select a goal.", variant: "destructive" });
             return;
        default:
            goalData = { type: selectedGoal, country: selectedCountry };
    }
    
    setUserGoal(goalData);
    toast({ title: "Profile Synced", description: "Your neural stream is now personalized." });
    onClose();
  };
  
  const universities = useMemo(() => Object.keys(COLLEGE_DATA || {}), []);
  const programs = useMemo(() => (university && COLLEGE_DATA[university]) ? Object.keys(COLLEGE_DATA[university].programs || {}) : [], [university]);
  const branches = useMemo(() => (university && program && COLLEGE_DATA[university]?.programs?.[program]) ? Object.keys(COLLEGE_DATA[university].programs[program].branches || {}) : [], [university, program]);
  const semesters = useMemo(() => (university && program && branch && COLLEGE_DATA[university]?.programs?.[program]?.branches?.[branch]) ? Object.keys(COLLEGE_DATA[university].programs[program].branches[branch].semesters || {}) : [], [university, program, branch]);
  
  if (!isReady) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl p-0 overflow-hidden flex flex-col h-[85vh] sm:h-auto bg-background/95 backdrop-blur-xl border-primary/20">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-2xl text-center font-black text-primary uppercase tracking-tighter">{t('profiling.title')}</DialogTitle>
          <DialogDescription className="text-center font-medium">{t('profiling.subtitle')}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
            <ScrollArea className="flex-1 px-6 py-4">
                <AnimatePresence mode="wait">
                    {step === 1 ? (
                        <motion.div 
                            key="step1"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-6"
                        >
                            <div className="space-y-2">
                                <Label className="font-bold uppercase text-[10px] tracking-widest text-primary">{t('news.filters.countryLabel')}</Label>
                                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                                    <SelectTrigger className="h-12 bg-background/50 border-primary/20">
                                        <SelectValue placeholder="Select Region..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {NEWS_COUNTRIES.map(c => (
                                            <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {GOAL_CARDS_DATA.map(goal => (
                                    <GoalCard 
                                        key={goal.type}
                                        icon={goal.icon}
                                        title={goal.title}
                                        description={goal.description}
                                        goalType={goal.type as GoalType}
                                        isSelected={selectedGoal === goal.type}
                                        onSelect={setSelectedGoal}
                                    />
                                ))}
                            </div>
                            
                            {selectedGoal === 'college' && (
                                <Card className="p-4 bg-primary/5 border-primary/20">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <Select onValueChange={setUniversity} value={university}>
                                            <SelectTrigger className="bg-background/50"><SelectValue placeholder="University" /></SelectTrigger>
                                            <SelectContent>{universities.map(u => <SelectItem key={u} value={u}>{COLLEGE_DATA[u].name}</SelectItem>)}</SelectContent>
                                        </Select>
                                        <Select onValueChange={setProgram} value={program} disabled={!university}>
                                            <SelectTrigger className="bg-background/50"><SelectValue placeholder="Program" /></SelectTrigger>
                                            <SelectContent>{programs.map(p => <SelectItem key={p} value={p}>{COLLEGE_DATA[university]?.programs?.[p]?.name || p}</SelectItem>)}</SelectContent>
                                        </Select>
                                        <Select onValueChange={setBranch} value={branch} disabled={!program}>
                                            <SelectTrigger className="bg-background/50"><SelectValue placeholder="Branch" /></SelectTrigger>
                                            <SelectContent>{branches.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                                        </Select>
                                        <Select onValueChange={setSemester} value={semester} disabled={!branch}>
                                            <SelectTrigger className="bg-background/50"><SelectValue placeholder="Semester" /></SelectTrigger>
                                            <SelectContent>{semesters.map(s => <SelectItem key={s} value={s}>{s} Sem</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                </Card>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <div className="space-y-4">
                                <Label className="text-lg font-bold">{t('profiling.happy.label')}</Label>
                                <Select value={happyState} onValueChange={setHappyState}>
                                    <SelectTrigger className="h-12 border-primary/20">
                                        <SelectValue placeholder={t('profiling.happy.placeholder')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="learning">{t('profiling.happy.learning')}</SelectItem>
                                        <SelectItem value="creating">{t('profiling.happy.creating')}</SelectItem>
                                        <SelectItem value="solving">{t('profiling.happy.solving')}</SelectItem>
                                        <SelectItem value="growth">{t('profiling.happy.growth')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-4">
                                <Label className="text-lg font-bold">{t('profiling.languages.label')}</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {APP_LANGUAGES.map(lang => (
                                        <Button 
                                            key={lang.value} 
                                            variant="outline" 
                                            className={cn("h-12 justify-start font-bold", selectedCountry === lang.value && "border-primary bg-primary/5")}
                                        >
                                            {lang.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <Card className="p-6 border-primary/20 bg-primary/5">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <Label className="text-lg font-bold">{t('profiling.aiLove.label')}</Label>
                                        <p className="text-xs text-muted-foreground">{t('profiling.aiLove.desc')}</p>
                                    </div>
                                    <Switch checked={aiLove} onCheckedChange={setAiLove} />
                                </div>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>
            </ScrollArea>
        </div>

        <DialogFooter className="p-6 pt-2 border-t bg-card/20">
          <div className="flex w-full gap-3">
              {step === 2 && (
                  <Button variant="outline" onClick={() => setStep(1)} className="font-bold">
                      {t('customTest.test.previousButton')}
                  </Button>
              )}
              <Button 
                  onClick={() => step === 1 ? setStep(2) : handleSaveGoal()} 
                  disabled={!selectedGoal} 
                  className="flex-1 h-12 text-lg font-bold uppercase tracking-widest shadow-primary/20 shadow-xl"
              >
                {step === 1 ? t('customTest.test.nextButton') : "Initialize Stream"}
              </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}