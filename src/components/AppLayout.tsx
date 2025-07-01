"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { Skeleton } from '@/components/ui/skeleton';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthenticating, setIsAuthenticating] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        // If the user is logged out, redirect to the homepage.
        router.push('/');
      } else {
        // User is logged in, we can show the content.
        setIsAuthenticating(false);
      }
    });

    // Clean up the listener when the component unmounts.
    return () => unsubscribe();
  }, [router]);

  // While Firebase is checking the auth state, show a loading skeleton.
  if (isAuthenticating) {
    return (
        <div className="flex h-screen flex-col">
            <Header />
            <main className="flex-1 overflow-y-auto bg-background pb-20 pt-4">
                <div className="container mx-auto max-w-3xl px-4 space-y-6">
                    <Skeleton className="h-8 w-1/2 rounded" />
                    <Skeleton className="h-40 w-full rounded-lg" />
                    <div className="space-y-3">
                        <Skeleton className="h-20 w-full rounded-lg" />
                        <Skeleton className="h-20 w-full rounded-lg" />
                        <Skeleton className="h-20 w-full rounded-lg" />
                    </div>
                </div>
            </main>
            <BottomNav />
        </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <Header />
      <main className="flex-1 overflow-y-auto bg-background pb-20 pt-4">
        <div className="container mx-auto max-w-3xl px-4">
            {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
