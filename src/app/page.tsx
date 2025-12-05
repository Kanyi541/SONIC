
"use client";

import LoginTabs from "@/components/login/login-tabs";
import Image from "next/image";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-primary via-secondary to-secondary">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-[200px] h-[140px] rounded-[50%] overflow-hidden flex items-center justify-center shadow-2xl">
            <Image 
              src="/logo.jpeg" 
              alt="Sonic Motor Valuers Logo" 
              width={220}
              height={160}
              className="object-cover"
              priority
            />
          </div>
        </div>
        <p className="text-center text-gray-300 mb-8 font-body">
          Please select your role and sign in to continue.
        </p>
        <LoginTabs />
      </div>
    </main>
  );
}
