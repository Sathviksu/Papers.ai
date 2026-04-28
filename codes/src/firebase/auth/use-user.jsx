'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, getRedirectResult } from 'firebase/auth';
import { useAuth } from '../provider';

export function useUser() {
  const auth = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Handle redirect result for signInWithRedirect
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          // User signed in via redirect
          console.log('Redirect login successful:', result.user);
        }
      } catch (error) {
        // Silent fail - user may not be returning from redirect
        console.debug('No redirect result:', error.code);
      }
    };

    handleRedirectResult();

    // onAuthStateChanged is asynchronous, so we need to handle the initial state
    setLoading(true);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  return { user, loading };
}
