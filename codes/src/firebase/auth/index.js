"use client";

import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  browserPopupRedirectResolver,
  signOut as firebaseSignOut,
  getAdditionalUserInfo,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";

async function signInWithGoogle(auth) {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  try {
    // Try popup first — works on Chrome, Edge, most browsers
    return await signInWithPopup(auth, provider, browserPopupRedirectResolver);
  } catch (err) {
    if (
      err.code === "auth/popup-blocked" ||
      err.code === "auth/popup-closed-by-user" ||
      err.code === "auth/cancelled-popup-request"
    ) {
      // Fallback to redirect for Safari and strict browsers
      return signInWithRedirect(auth, provider, browserPopupRedirectResolver);
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
