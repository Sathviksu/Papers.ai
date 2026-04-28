'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useUser } from '@/firebase';

export default function AuthHandler({ children }) {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // After auth loading completes and user exists, redirect to dashboard
    if (!loading && user) {
      const currentPath = window.location.pathname;
      if (currentPath === '/login') {
        router.push('/dashboard');
      }
    }
  }, [user, loading, router]);

  return children;
}