
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Download } from 'lucide-react';
import Image from 'next/image';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed',
    platform: string
  }>;
  prompt(): Promise<void>;
}

export default function InstallPwaPrompt() {
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isDialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      event.preventDefault();
      // Stash the event so it can be triggered later.
      setInstallPromptEvent(event as BeforeInstallPromptEvent);
      // Check if the app has been installed before
      const appInstalled = localStorage.getItem('pwa_installed');
      if (!appInstalled) {
        setDialogOpen(true);
      }
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
    // Show the browser's install prompt
    installPromptEvent.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await installPromptEvent.userChoice;
    if (outcome === 'accepted') {
      localStorage.setItem('pwa_installed', 'true');
    }
    // We've used the prompt, and can't use it again, so clear it
    setInstallPromptEvent(null);
    setDialogOpen(false);
  };

  const handleDismiss = () => {
    setDialogOpen(false);
  };

  if (!isDialogOpen) {
    return null;
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent>
        <DialogHeader className="items-center text-center">
            <Image src="/logo.jpeg" alt="Sonic Motor Valuers" width={80} height={80} className="rounded-xl mb-4" />
          <DialogTitle className="text-2xl font-bold">Install Sonic Motor Valuers App</DialogTitle>
          <DialogDescription>
            Get a faster, more integrated experience by installing our app on your device. It's quick, easy, and works offline!
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-col sm:space-x-0 gap-2">
          <Button onClick={handleInstallClick} size="lg">
            <Download className="mr-2 h-5 w-5" />
            Install App
          </Button>
          <Button onClick={handleDismiss} variant="ghost" size="lg">
            Maybe Later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
