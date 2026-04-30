'use client';

import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
} from 'react';

import { onAuthStateChanged, getRedirectResult } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

export const FirebaseContext = createContext(undefined);

export const FirebaseProvider = ({
  children,
  firebaseApp,
  firestore,
  auth,
}) => {
  const [userAuthState, setUserAuthState] = useState({
    user: null,
    isUserLoading: true,
    userError: null,
  });

  useEffect(() => {
    if (!auth) {
      setUserAuthState({
        user: null,
        isUserLoading: false,
        userError: new Error('Auth service not provided.'),
      });
      return;
    }

    setUserAuthState({ user: null, isUserLoading: true, userError: null });

    let redirectChecked = false;

    // Check redirect result first
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          setUserAuthState({
            user: result.user,
            isUserLoading: false,
            userError: null,
          });
        }
      })
      .catch((error) => {
        console.error('getRedirectResult error:', error);
      })
      .finally(() => {
        redirectChecked = true;
      });

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      // Wait until redirect check is done before trusting null user
      if (!redirectChecked && !firebaseUser) return;

      setUserAuthState({
        user: firebaseUser,
        isUserLoading: false,
        userError: null,
      });
    });

    return () => unsubscribe();
  }, [auth]);

  const contextValue = useMemo(() => {
    const servicesAvailable = !!(firebaseApp && firestore && auth);

    const setUser = (user) => {
      setUserAuthState(prev => ({
        ...prev,
        user,
        isUserLoading: false,
        userError: null,
      }));
    };

    const setLocalLoading = (isLoading) => {
      setUserAuthState(prev => ({
        ...prev,
        isUserLoading: isLoading,
      }));
    };

    return {
      areServicesAvailable: servicesAvailable,
      firebaseApp: servicesAvailable ? firebaseApp : null,
      firestore: servicesAvailable ? firestore : null,
      auth: servicesAvailable ? auth : null,
      user: userAuthState.user,
      isUserLoading: userAuthState.isUserLoading,
      userError: userAuthState.userError,
      setUser,
      setLocalLoading,
    };
  }, [firebaseApp, firestore, auth, userAuthState]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);

  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }

  if (
    !context.areServicesAvailable ||
    !context.firebaseApp ||
    !context.firestore ||
    !context.auth
  ) {
    throw new Error(
      'Firebase core services not available. Check FirebaseProvider props.'
    );
  }

  return {
    firebaseApp: context.firebaseApp,
    firestore: context.firestore,
    auth: context.auth,
    user: context.user,
    // Expose both names so callers can use either
    loading: context.isUserLoading,
    isUserLoading: context.isUserLoading,
    userError: context.userError,
    // Expose setUser for synchronous auth state updates
    setUser: context.setUser,
    setLocalLoading: context.setLocalLoading,
  };
};

export const useAuth = () => {
  const { auth } = useFirebase();
  return auth;
};

export const useFirestore = () => {
  const { firestore } = useFirebase();
  return firestore;
};

export const useFirebaseApp = () => {
  const { firebaseApp } = useFirebase();
  return firebaseApp;
};

export function useMemoFirebase(factory, deps) {
  const memoized = useMemo(factory, deps);
  if (typeof memoized !== 'object' || memoized === null) return memoized;
  memoized.__memo = true;
  return memoized;
}