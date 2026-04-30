"use client";

import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  getAdditionalUserInfo,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";

async function signInWithGoogle(auth) {
  const provider = new GoogleAuthProvider();
  try {
    return await signInWithPopup(auth, provider); // try popup first
  } catch (err) {
    if (
      err.code === "auth/popup-blocked" ||
      err.code === "auth/popup-closed-by-user"
    ) {
      return signInWithRedirect(auth, provider); // fallback to redirect
    }
    throw err;
  }
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

export * from "./use-user";
