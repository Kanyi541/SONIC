
"use client";

import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import React, { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import { InstallPwaProvider } from '@/components/pwa/install-prompt';

function SplashScreen() {
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000); // 2 seconds

    return () => clearTimeout(timer);
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="google-site-verification" content="sQNTflIRGrcrQa1I-krENNhA3oRwYiW5ONoTFPgle6o" />
        <link rel="canonical" href="https://casadash.casamotorvaluers.co.ke/" />
        <link rel="icon" href="/logo.jpeg" type="image/jpeg" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0A2A66" />
        <link rel="apple-touch-icon" href="/logo.jpeg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap" rel="stylesheet" />
        <title>Sonic Motor Valuers - Motor Vehicle Assessors in Kenya</title>
        <meta name="description" content="Professional motor vehicle valuation and assessment services in Kenya. Trusted by insurance companies, banks, and financial institutions for car valuation, accident damage assessment, and more." />
        <meta name="keywords" content="Motor valuers in Kenya, Motor vehicle assessment services Kenya, Car valuation for insurance and bank loans, Vehicle accident damage assessment Kenya, Trusted motor valuation company Nairobi -portal" />
      </head>
      <body className="font-body antialiased">
        <InstallPwaProvider>
            {loading ? <SplashScreen /> : children}
            <Toaster />
        </InstallPwaProvider>
      </body>
    </html>
  );
}
