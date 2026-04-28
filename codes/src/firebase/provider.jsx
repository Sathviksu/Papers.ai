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

// Internal state for user authentication

// Combined state for the Firebase context

// Return type for useFirebase()

// Return type for useUser() - specific to user auth state

// React Context
export const FirebaseContext = createContext(undefined);

/**
 * FirebaseProvider manages and provides Firebase services and user authentication state.
 */
export const FirebaseProvider = ({
  children,
  firebaseApp,
  firestore,
  auth,
}) => {
  const [userAuthState, setUserAuthState] = useState({
    user: null,
    isUserLoading: true, // Start loading until first auth event
    userError: null,
  });

  // Effect to subscribe to Firebase auth state changes
  useEffect(() => {
    if (!auth) {
      // If no Auth service instance, cannot determine user state
      setUserAuthState({
        user: null,
        isUserLoading: false,
        userError: new Error('Auth service not provided.'),
      });
      return;
    }

    setUserAuthState({ user: null, isUserLoading: true, userError: null }); // Reset on auth instance change

    // Handle redirect result first (for signInWithRedirect)
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          // User signed in via redirect
          setUserAuthState({
            user: result.user,
            isUserLoading: false,
            userError: null,
          });
          return true;
        }
      } catch (error) {
        // Silent fail - user may not be returning from redirect
        console.debug('No redirect result:', error.code);
      }
      return false;
    };

    // Check redirect result, then listen for auth state changes
    handleRedirectResult().then((hadRedirectUser) => {
      if (hadRedirectUser) return; // Already set user from redirect

      const unsubscribe = onAuthStateChanged(
        auth,
        (firebaseUser) => {
          // Auth state determined
          setUserAuthState({
            user: firebaseUser,
            isUserLoading: false,
            userError: null,
          });
        },
        (error) => {
          // Auth listener error
          console.error('FirebaseProvider: onAuthStateChanged error:', error);
          setUserAuthState({
            user: null,
            isUserLoading: false,
            userError: error,
          });
        }
      );
      return () => unsubscribe(); // Cleanup
    });
  }, [auth]); // Depends on the auth instance

  // Memoize the context value
  const contextValue = useMemo(() => {
    const servicesAvailable = !!(firebaseApp && firestore && auth);
    return {
      areServicesAvailable: servicesAvailable,
      firebaseApp: servicesAvailable ? firebaseApp : null,
      firestore: servicesAvailable ? firestore : null,
      auth: servicesAvailable ? auth : null,
      user: userAuthState.user,
      isUserLoading: userAuthState.isUserLoading,
      userError: userAuthState.userError,
    };
  }, [firebaseApp, firestore, auth, userAuthState]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

/**
 * Hook to access core Firebase services and user authentication state.
 * Throws error if core services are not available or used outside provider.
 */
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
    isUserLoading: context.isUserLoading,
    userError: context.userError,
  };
};

/** Hook to access Firebase Auth instance. */
export const useAuth = () => {
  const { auth } = useFirebase();
  return auth;
};

/** Hook to access Firestore instance. */
export const useFirestore = () => {
  const { firestore } = useFirebase();
  return firestore;
};

/** Hook to access Firebase App instance. */
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


