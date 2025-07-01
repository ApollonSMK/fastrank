
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getLoggedInDriver } from '@/lib/data-service';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const driver = await getLoggedInDriver();
            if (driver && driver.email === 'info@fastrack.lu') {
                setIsAuthorized(true);
            } else {
                router.replace('/dashboard');
            }
            setIsLoading(false);
        };
        checkAuth();
    }, [router]);

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-1/2 rounded" />
                <Skeleton className="h-40 w-full rounded-lg" />
                <div className="space-y-3">
                    <Skeleton className="h-20 w-full rounded-lg" />
                    <Skeleton className="h-20 w-full rounded-lg" />
                    <Skeleton className="h-20 w-full rounded-lg" />
                </div>
            </div>
        );
    }
    
    return isAuthorized ? <>{children}</> : null;
}
