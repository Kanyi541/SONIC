
"use client";

import Image from 'next/image';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 transition-opacity duration-500 ease-in-out">
      <div className="w-[250px] h-[180px] rounded-[50%] overflow-hidden flex items-center justify-center shadow-2xl animate-pulse">
        <Image 
          src="/logo.jpeg" 
          alt="Sonic Motor Valuers Logo" 
          width={280}
          height={200}
          className="object-cover"
          priority
        />
      </div>
    </div>
  );
}
