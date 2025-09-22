
"use client";

import { Car } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Car className="h-12 w-12 animate-pulse text-primary" />
        <p className="text-lg font-medium text-muted-foreground mt-4">
          Loading Assessment...
        </p>
      </div>
    </div>
  );
}
