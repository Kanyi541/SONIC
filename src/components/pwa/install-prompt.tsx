
"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed',
    platform: string
  }>;
  prompt(): Promise<void>;
}

interface InstallPromptContextType {
  installPromptEvent: BeforeInstallPromptEvent | null;
  handleInstallClick: () => void;
}

const InstallPromptContext = createContext<InstallPromptContextType | null>(null);

export const useInstallPrompt = () => {
  return useContext(InstallPromptContext);
};

export function InstallPwaProvider({ children }: { children: ReactNode }) {
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPromptEvent(event as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPromptEvent) {
      return;
    }
    installPromptEvent.prompt();
    const { outcome } = await installPromptEvent.userChoice;
    if (outcome === 'accepted') {
      localStorage.setItem('pwa_installed', 'true');
    }
    setInstallPromptEvent(null);
  };

  return (
    <InstallPromptContext.Provider value={{ installPromptEvent, handleInstallClick }}>
      {children}
    </InstallPromptContext.Provider>
  );
}

export function InstallPwaButton() {
    const context = useInstallPrompt();

    if (!context || !context.installPromptEvent) {
        return null;
    }

    return (
        <Button onClick={context.handleInstallClick} variant="ghost" className="w-full justify-start">
            <Download className="mr-2 h-4 w-4" />
            Download App
        </Button>
    );
}
