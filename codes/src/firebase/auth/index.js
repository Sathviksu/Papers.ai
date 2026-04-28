'use client';

import {
  GoogleAuthProvider,
  signInWithRedirect,
  signOut as firebaseSignOut,
  getAdditionalUserInfo,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  getRedirectResult,
} from 'firebase/auth';

function signInWithGoogle(auth) {
  const provider = new GoogleAuthProvider();
  return signInWithRedirect(auth, provider);
}

function signOut(auth) {
  return firebaseSignOut(auth);
}

export {
  signInWithGoogle,
  signOut,
  getAdditionalUserInfo,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  getRedirectResult,
};

export * from './use-user';
