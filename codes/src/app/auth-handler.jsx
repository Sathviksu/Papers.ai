'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useUser } from '@/firebase';

export default function AuthHandler({ children }) {
  const { user, loading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // After auth loading completes and user exists, redirect to dashboard
    if (!loading && user) {
      if (pathname === '/login' || pathname === '/') {
        router.push('/dashboard');
      }
    }
  }, [user, loading, router, pathname]);

  return children;
}