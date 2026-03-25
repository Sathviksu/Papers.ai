'use client';

import { doc, setDoc, serverTimestamp, type Firestore } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { errorEmitter } from './error-emitter';
import { FirestorePermissionError } from './errors';

export async function createUserProfile(
  user: User,
  firestore: Firestore,
  additionalData: { name?: string } = {}
) {
  if (!user) return;

  const userRef = doc(firestore, 'users', user.uid);
  const userData = {
    id: user.uid,
    email: user.email,
    name: additionalData.name || user.displayName || user.email,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  // Use a non-blocking write with error handling
  setDoc(userRef, userData, { merge: true }).catch((error) => {
    const contextualError = new FirestorePermissionError({
      path: userRef.path,
      operation: 'write',
      requestResourceData: userData,
    });
    errorEmitter.emit('permission-error', contextualError);
    // Also log for server-side debugging if needed, but the primary mechanism is the emitter.
    console.error('Error creating user profile:', error);
  });
}
