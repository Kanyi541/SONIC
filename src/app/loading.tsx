
"use client";

import { Car } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="relative flex items-center justify-center">
        <Car className="h-20 w-20 text-primary animate-car-rumble" />
        <div className="absolute top-0 left-0 right-0 h-full w-full overflow-hidden">
          <div className="absolute left-0 h-0.5 w-full bg-primary/50 shadow-[0_0_10px_theme(colors.primary)] animate-scanner" />
        </div>
      </div>
    </div>
  );
}
