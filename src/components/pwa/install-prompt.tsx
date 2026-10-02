
"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';
import { isIOS, isStandalone } from '@/lib/pwa-utils';

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
  dismissInstallPrompt: () => void;
  isIOS: boolean;
  isStandalone: boolean;
}

const InstallPromptContext = createContext<InstallPromptContextType | null>(null);

export const useInstallPrompt = () => {
  return useContext(InstallPromptContext);
};

export function InstallPwaProvider({ children }: { children: ReactNode }) {
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOSDevice, setIsIOSDevice] = useState(false);
  const [isStandaloneMode, setIsStandaloneMode] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    setIsIOSDevice(isIOS());
    setIsStandaloneMode(isStandalone());

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPromptEvent(event as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if user already dismissed iOS instructions
    const dismissedIOS = localStorage.getItem('ios_instructions_dismissed');
    if (!dismissedIOS && isIOS() && !isStandalone()) {
      setShowIOSInstructions(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOSDevice) {
      // Show iOS installation instructions
      setShowIOSInstructions(true);
      return;
    }

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

  const dismissInstallPrompt = () => {
    if (isIOSDevice) {
      localStorage.setItem('ios_instructions_dismissed', 'true');
      setShowIOSInstructions(false);
    } else {
      setInstallPromptEvent(null);
    }
  };

  return (
    <InstallPromptContext.Provider value={{ 
      installPromptEvent, 
      handleInstallClick, 
      dismissInstallPrompt,
      isIOS: isIOSDevice,
      isStandalone: isStandaloneMode
    }}>
      {children}
      {(installPromptEvent || (isIOSDevice && showIOSInstructions && !isStandaloneMode)) && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom">
          <div className="bg-card border border-border rounded-lg shadow-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-sm">Install Sonic Valuers App</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {isIOSDevice 
                    ? "Tap the Share button and select 'Add to Home Screen'"
                    : "Get the full experience with our app"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={dismissInstallPrompt}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Button onClick={handleInstallClick} className="w-full" size="sm">
              <Download className="mr-2 h-4 w-4" />
              {isIOSDevice ? "Show Instructions" : "Install App"}
            </Button>
          </div>
        </div>
      )}
    </InstallPromptContext.Provider>
  );
}

export function InstallPwaButton() {
    const context = useInstallPrompt();

    if (!context || context.isStandalone) {
        return null;
    }

    return (
        <Button onClick={context.handleInstallClick} variant="ghost" className="w-full justify-start">
            <Download className="mr-2 h-4 w-4" />
            Download App
        </Button>
    );
}
