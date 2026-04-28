'use client';

import { useFirebase } from '../provider';

export function useUser() {
  const { user, isUserLoading, userError } = useFirebase();
  return { user, loading: isUserLoading, error: userError };
}
