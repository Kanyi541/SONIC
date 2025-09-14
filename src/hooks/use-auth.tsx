
"use client";

import { useState, useEffect, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return { user, loading };
}

export function AuthGuard({ children, allowClients = false }: { children: ReactNode, allowClients?: boolean }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [isClientAuthed, setClientAuthed] = useState(false);

    useEffect(() => {
        if (loading) return;

        let clientSession = null;
        if (typeof window !== 'undefined') {
            clientSession = sessionStorage.getItem('loggedInUser');
        }

        const isFirebaseUser = !!user;
        const isClientSessionUser = allowClients && !!clientSession;
        
        if (!isFirebaseUser && !isClientSessionUser) {
            router.push('/');
        } else {
            setClientAuthed(true);
        }

    }, [user, loading, router, allowClients]);

    if (loading || !isClientAuthed) {
        return (
            <div className="flex h-screen items-center justify-center">
                <p>Loading...</p>
            </div>
        );
    }

    return <>{children}</>;
}

    