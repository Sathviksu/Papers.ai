'use client';

import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  getAdditionalUserInfo,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';

function signInWithGoogle(auth) {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
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
