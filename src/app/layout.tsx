import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: 'CASA DASH - Motor Vehicle Valuers & Assessors in Kenya',
  description: 'Professional motor vehicle valuation and assessment services in Kenya. Trusted by insurance companies, banks, and financial institutions for car valuation, accident damage assessment, and more.',
  keywords: [
    'Motor valuers in Kenya',
    'Motor vehicle assessment services Kenya',
    'Car valuation for insurance and bank loans',
    'Vehicle accident damage assessment Kenya',
    'Trusted motor valuation company Nairobi -portal'
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="google-site-verification" content="sQNTflIRGrcrQa1I-krENNhA3oRwYiW5ONoTFPgle6o" />
        <link rel="canonical" href="https://casadash.casamotorvaluers.co.ke/" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
