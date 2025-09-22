
"use client";

import { useState, useEffect, ComponentType, FC } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Loading from '@/app/loading';

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

interface AuthGuardOptions {
  allowClients?: boolean;
}

export function AuthGuard<P extends object>(
  WrappedComponent: ComponentType<P>,
  options: AuthGuardOptions = {}
): FC<P> {
  const WithAuth: FC<P> = (props) => {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [isVerified, setIsVerified] = useState(false);

    useEffect(() => {
        if (loading) return;

        let clientSession = null;
        if (typeof window !== 'undefined') {
            clientSession = sessionStorage.getItem('loggedInUser');
        }

        const isFirebaseUser = !!user;
        const isClientSessionUser = options.allowClients && !!clientSession;
        
        if (!isFirebaseUser && !isClientSessionUser) {
            router.push('/');
        } else {
            setIsVerified(true);
        }

    }, [user, loading, router]);

    if (!isVerified) {
        return <Loading />;
    }

    return <WrappedComponent {...props} />;
  }

  WithAuth.displayName = `AuthGuard(${(WrappedComponent.displayName || WrappedComponent.name || 'Component')})`;

  return WithAuth;
}
