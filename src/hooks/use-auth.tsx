

"use client";

import { useState, useEffect, type ReactNode, ComponentType } from 'react';
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

export function AuthGuard<P extends {}>(
  WrappedComponent: ComponentType<P>,
  options?: { allowClients?: boolean }
): React.FC<P> {
  const AuthComponent: React.FC<P> = (props) => {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [isAuthed, setAuthed] = useState(false);

    useEffect(() => {
        if (loading) return;

        let clientSession = null;
        if (typeof window !== 'undefined') {
            clientSession = sessionStorage.getItem('loggedInUser');
        }

        const isFirebaseUser = !!user;
        const isClientSessionUser = options?.allowClients && !!clientSession;
        
        if (!isFirebaseUser && !isClientSessionUser) {
            router.push('/');
        } else {
            setAuthed(true);
        }

    }, [user, loading, router]);

    if (loading || !isAuthed) {
        return (
            <div className="flex h-screen items-center justify-center">
                <p>Loading...</p>
            </div>
        );
    }

    return <WrappedComponent {...props} />;
  }
  AuthComponent.displayName = `AuthGuard(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
  return AuthComponent;
}
