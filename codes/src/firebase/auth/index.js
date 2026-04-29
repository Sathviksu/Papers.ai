'use client';

import {
  GoogleAuthProvider,
  signInWithRedirect,
  signOut as firebaseSignOut,
  getAdditionalUserInfo,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
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
};

export * from './use-user';
