
"use client";

import React from 'react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '@/components/ui/dropdown-menu';
import { Settings, Bot } from 'lucide-react';
import { Button } from '../ui/button';
import Assistant from '@/components/features/assistant/Assistant';
import SettingsMenuContent from './SettingsMenuContent';
import ProfileMenuContent from './ProfileMenuContent';

export function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-end gap-2 border-b bg-background/90 px-4 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 sm:px-6">
       <div className="flex items-center gap-3">
            {/* J.A.R.V.I.S. trigger placed beside Chatbot robot icon */}
            <Assistant />

            <Button asChild variant="outline" size="icon" className="h-9 w-9 rounded-full border-primary/20 hover:bg-primary/5 transition-all">
                <Link href="/chatbot">
                    <Bot className="h-5 w-5 text-primary" />
                </Link>
            </Button>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="h-9 w-9 rounded-full">
                        <Settings className="h-5 w-5" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={8} className="p-4 w-72 bg-card/95 backdrop-blur-xl border-primary/20">
                    <ProfileMenuContent />
                    <div className="mt-4 pt-4 border-t border-primary/10">
                        <SettingsMenuContent />
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>
       </div>
    </header>
  );
}
