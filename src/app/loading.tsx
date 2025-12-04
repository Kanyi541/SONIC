
"use client";

import Image from 'next/image';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="relative flex items-center justify-center">
        <Image 
          src="/logo.png" 
          alt="Sonic Motor Valuers Logo" 
          width={150} 
          height={150} 
          className="animate-pulse"
          priority
        />
        <div className="absolute top-0 left-0 right-0 h-full w-full overflow-hidden rounded-full">
          <div className="absolute left-0 h-0.5 w-full bg-primary/30 shadow-[0_0_15px_theme(colors.primary)] animate-scanner" />
        </div>
      </div>
    </div>
  );
}
