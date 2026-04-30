'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useFirebase } from '@/firebase';

export default function AuthHandler({ children }) {
  const { user, loading, auth } = useFirebase();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // After auth loading completes and user exists, redirect to dashboard
    if (!loading && (user || auth?.currentUser)) {
      if (pathname === '/login') {
        router.push('/dashboard');
      }
    }
  }, [user, loading, router, pathname, auth]);

  return children;
}