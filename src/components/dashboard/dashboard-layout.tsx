"use client";

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

type DashboardLayoutProps = {
    title: string;
    children: React.ReactNode;
    isFirebase?: boolean;
};

export default function DashboardLayout({ title, children, isFirebase = false }: DashboardLayoutProps) {
    const router = useRouter();
    const { toast } = useToast();

    const handleLogout = async () => {
        try {
            if (isFirebase) {
                await signOut(auth);
                toast({ title: "Logged Out", description: "You have been successfully signed out." });
            }
            router.push('/');
        } catch (error) {
            console.error("Error signing out: ", error);
            toast({ variant: "destructive", title: "Logout Failed", description: "An error occurred while signing out." });
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <header className="sticky top-0 z-40 w-full border-b bg-card">
                <div className="container flex h-16 items-center justify-between">
                    <h1 className="text-2xl font-headline font-bold text-primary">{title}</h1>
                    <Button variant="outline" onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                    </Button>
                </div>
            </header>
            <main className="flex-1 container py-8">
                {children}
            </main>

        </div>
    );
}