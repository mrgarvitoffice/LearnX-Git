
"use client";

import { useEffect, useState, useRef, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ArrowRight, CheckCircle, FileText, TestTubeDiagonal, Newspaper, Sparkles, Loader2, History, ListTodo, BookMarked, Code2, Settings2 } from "lucide-react";
import Link from "next/link";
import { useTTS } from '@/hooks/useTTS';
import { useSound } from '@/hooks/useSound';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Logo } from '@/components/icons/Logo';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { getTranslatedQuote } from '@/lib/actions/quote-actions';
import type { TranslatedQuote } from '@/lib/types';
import { TotalUsers } from '@/components/features/dashboard/TotalUsers';
import { useSettings } from '@/contexts/SettingsContext';
import { useProgression } from '@/contexts/ProgressionContext';

const ActionCard = ({ titleKey, descriptionKey, buttonTextKey, href, icon: Icon, delay = 0, className }: { titleKey: string, descriptionKey: string, buttonTextKey: string, href: string, icon: React.ElementType, delay?: number, className?: string }) => {
    const { t } = useTranslation();
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5 }}
            whileHover={{ y: -5, scale: 1.02 }} 
            className={cn("w-full h-full", className)}
        >
            <Card className="glass-card shadow-2xl h-full flex flex-col relative overflow-hidden group border-primary/10">
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-primary/10 text-primary transition-all duration-300 group-hover:bg-primary/20 group-hover:scale-110">
                            <Icon className="w-6 h-6" />
                        </div>
                        <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">{t(titleKey)}</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="flex-grow">
                    <p className="text-muted-foreground text-sm leading-relaxed">{t(descriptionKey)}</p>
                </CardContent>
                <CardFooter className="mt-auto">
                    <Button asChild className="w-full relative overflow-hidden font-bold uppercase tracking-tight">
                        <Link href={href}>
                            <span className="relative z-10 flex items-center">
                                {t(buttonTextKey)} 
                                <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1"/>
                            </span>
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </motion.div>
    );
}

const DailyQuestItem = ({ isCompleted, text, progress, target }: { isCompleted: boolean; text: string; progress: number; target: number }) => (
    <div className={cn("flex items-center justify-between p-3 rounded-xl border border-transparent transition-all", isCompleted ? "text-muted-foreground line-through bg-primary/5 opacity-60" : "bg-white/5 hover:bg-primary/5 hover:border-primary/20")}>
        <div className="flex items-center gap-3">
            {isCompleted ? (
                <CheckCircle className="text-emerald-500 h-4 w-4" />
            ) : (
                <div className="w-4 h-4 rounded-full border-2 border-primary/40 animate-pulse" />
            )}
            <span className="text-sm font-semibold">{text}</span>
        </div>
        {!isCompleted && (
            <span className="text-[10px] font-mono text-muted-foreground bg-black/20 px-2 py-0.5 rounded-full">
                {progress}/{target}
            </span>
        )}
    </div>
);

export default function DashboardPage() {
    const { t, isReady } = useTranslation();
    const { speak } = useTTS();
    const { playSound: playClickSound } = useSound('/sounds/ting.mp3', { priority: 'incidental' });
    const router = useRouter();
    const { quests, xp } = useProgression();
    const { appLanguage } = useSettings();
    
    const [recentTopics, setRecentTopics] = useState<string[]>([]);
    const pageTitleSpokenRef = useRef(false);

    const { data: quote, isLoading: isLoadingQuote } = useQuery<TranslatedQuote>({
        queryKey: ['motivationalQuote', appLanguage],
        queryFn: () => getTranslatedQuote(appLanguage),
        staleTime: 1000 * 60 * 60,
    });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedTopics = localStorage.getItem('learnmint-recent-topics');
            if (storedTopics) {
                try { setRecentTopics(JSON.parse(storedTopics).slice(0, 5)); } catch (e) { localStorage.removeItem('learnmint-recent-topics'); }
            }
        }
    }, []);

    useEffect(() => {
        if (isReady && !pageTitleSpokenRef.current) {
            const timer = setTimeout(() => {
                speak(t('dashboard.welcome'), { priority: 'essential' });
                pageTitleSpokenRef.current = true;
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [speak, t, isReady]);

    const handleRecentTopicClick = (topic: string) => {
        playClickSound();
        router.push(`/study?topic=${encodeURIComponent(topic)}`);
    }

    const questList = useMemo(() => [
        { id: 'notes', text: t('dashboard.dailyQuests.quest1'), progress: quests.notesCreated, target: 2, isDone: quests.notesCreated >= 2 },
        { id: 'tests', text: t('dashboard.dailyQuests.quest2'), progress: quests.testsAttempted, target: 1, isDone: quests.testsAttempted >= 1 },
        { id: 'news', text: t('dashboard.dailyQuests.quest3'), progress: quests.newsRead, target: 3, isDone: quests.newsRead >= 3 },
    ], [quests, t]);

    if (!isReady) return <div className="flex min-h-[60vh] w-full items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;

    return (
        <div className="space-y-12 py-8 w-full">
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }} className="text-center relative">
                <Logo size={100} className="mx-auto" />
                <h1 className="text-4xl md:text-5xl font-black mt-6 tracking-tight text-foreground drop-shadow-sm">
                    Welcome to LearnX
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground mt-3 max-w-2xl mx-auto font-medium opacity-80">
                    Multi Agent AI platform bridging knowledge gaps with real-time, personalized mastery paths.
                </p>
                <div className="flex flex-col items-center justify-center mt-6">
                    <div className="bg-primary/10 border border-primary/20 rounded-full px-6 py-2 mb-3 shadow-lg shadow-primary/5">
                        <span className="text-primary font-black tracking-widest uppercase text-sm">XP YIELD: {xp}/30</span>
                    </div>
                    <TotalUsers />
                </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
               <ActionCard titleKey="dashboard.generateMaterials.title" descriptionKey="dashboard.generateMaterials.description" buttonTextKey="dashboard.generateMaterials.button" href="/notes" icon={FileText} delay={0.1} />
               <ActionCard titleKey="sidebar.library" descriptionKey="library.description" buttonTextKey="dashboard.generateMaterials.button" href="/library" icon={BookMarked} delay={0.2} />
               <ActionCard titleKey="dashboard.coding.title" descriptionKey="dashboard.coding.description" buttonTextKey="dashboard.coding.button" href="/coding" icon={Code2} delay={0.3} />
               
               <ActionCard titleKey="dashboard.customTest.title" descriptionKey="dashboard.customTest.description" buttonTextKey="dashboard.customTest.button" href="/custom-test" icon={TestTubeDiagonal} delay={0.4} />
               <ActionCard titleKey="news.title" descriptionKey="news.description" buttonTextKey="dashboard.dailyNews.button" href="/news" icon={Newspaper} delay={0.5} />
               
               <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="w-full">
                    <Card className="glass-card shadow-2xl h-full flex flex-col border-dashed border-primary/30 relative overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between py-3">
                            <CardTitle className="flex items-center gap-3 text-base tracking-tight uppercase font-black">
                                <ListTodo className="text-primary h-4 w-4"/>{t('dashboard.dailyQuests.title')}
                            </CardTitle>
                            <Button asChild variant="ghost" size="sm" className="h-8 text-[10px] font-black uppercase tracking-widest hover:bg-primary/10">
                                <Link href="/scheduler">
                                    <Settings2 className="w-3 h-3 mr-1.5" />
                                    {t('dashboard.dailyQuests.customize')}
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-2 flex-grow py-0 overflow-y-auto custom-scrollbar">
                            {questList.map((quest) => (
                                <DailyQuestItem key={quest.id} isCompleted={quest.isDone} text={quest.text} progress={quest.progress} target={quest.target} />
                            ))}
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto w-full">
                <Card className="glass-card h-full relative overflow-hidden group border-primary/10">
                    <CardHeader>
                        <div className="flex items-center gap-3 mb-4">
                            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                            <CardTitle className="text-xl font-black uppercase tracking-tighter">{t('dashboard.dailyMotivation.title')}</CardTitle>
                        </div>
                        <div className="min-h-[100px] flex flex-col justify-center italic">
                            {isLoadingQuote ? (
                                <div className="flex items-center gap-3 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /><span className="text-xs uppercase">Syncing...</span></div>
                            ) : quote ? (
                                <div className="space-y-2">
                                    <p className="text-lg md:text-xl font-bold leading-tight text-foreground/90 tracking-tight">"{quote.quote}"</p>
                                    <p className="text-sm not-italic font-black text-primary/80 uppercase tracking-widest">— {quote.author}</p>
                                </div>
                            ) : <p className="text-destructive text-sm uppercase">Feed interrupted.</p>}
                        </div>
                    </CardHeader>
                </Card>
                <Card className="glass-card h-full border-primary/10">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-xl font-black uppercase tracking-tighter">
                            <History className="text-primary h-5 w-5"/> {t('dashboard.recentTopics.title')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {recentTopics.length > 0 ? (
                            <div className="space-y-2">
                                {recentTopics.map((topic, index) => (
                                    <button key={index} onClick={() => handleRecentTopicClick(topic)} className="w-full flex justify-between items-center p-3 rounded-xl border border-white/5 bg-white/5 transition-all hover:bg-primary/10 group">
                                        <span className="truncate font-bold text-xs uppercase tracking-tight">{topic}</span>
                                        <ArrowRight className="h-3 w-3 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                    </button>
                                ))}
                            </div>
                        ) : <div className="text-center py-8 text-xs text-muted-foreground border-2 border-dashed border-white/5 rounded-2xl font-bold italic">{t('dashboard.recentTopics.empty')}</div>}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
