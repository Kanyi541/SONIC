/**
 * PWA utility functions for detecting device capabilities and installation status
 */

/**
 * Check if the device is running iOS
 */
export function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent);
}

/**
 * Check if the app is running in standalone mode (installed PWA)
 */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

/**
 * Check if the device supports PWA installation
 */
export function canInstallPWA(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check if it's a mobile device
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    window.navigator.userAgent
  );
  
  // Check if it's running in standalone mode
  const standalone = isStandalone();
  
  return isMobile && !standalone;
}

/**
 * Get the appropriate installation instructions based on device
 */
export function getInstallInstructions(): string {
  if (isIOS()) {
    return "Tap the Share button at the bottom of the screen, then scroll down and tap 'Add to Home Screen'.";
  }
  
  if (/Android/i.test(window.navigator.userAgent)) {
    return "Tap the menu button (three dots) and select 'Install app' or 'Add to Home screen'.";
  }
  
  return "Look for the install button in your browser's address bar or menu.";
}

/**
 * Register service worker
 */
export async function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/',
    });
    
    console.log('Service Worker registered with scope:', registration.scope);
    
    // Listen for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New version available
            console.log('New service worker available');
          }
        });
      }
    });
    
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}

/**
 * Check for service worker updates
 */
export async function checkForUpdates() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }

  const registration = await navigator.serviceWorker.getRegistration();
  if (registration) {
    await registration.update();
    return true;
  }
  return false;
}
