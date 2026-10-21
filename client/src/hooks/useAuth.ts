/**
 * @module EventGenie/UseAuth
 * @description Authentication hook providing anonymous user sign-in, state persistence, and plan initialization
 * @version 1.0.0
 * @license MIT
 */

// --- External Dependencies ---
import { useEffect, useState, useCallback, useRef } from 'react';
import { User, signOut as firebaseSignOut } from 'firebase/auth';

// --- Internal Modules ---
import { auth, signInAnonymouslySafe, onAuthStateChangedListener, loadUserPlan, saveUserPlan, logPlanEvent } from '../firebase';

// --- Utilities ---
import { AuthError } from '../utils/errors';

/** Return type for the useAuth hook */
export interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  error: Error | null;
  isNew: boolean;
  signOut: () => Promise<void>;
}

/** Hook for managing anonymous Firebase authentication, persistence, and profile state */
export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isNew, setIsNew] = useState<boolean>(false);
  const initTriggeredRef = useRef<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChangedListener((currentUser) => {
      if (!isMounted) {
        return;
      }

      setUser(currentUser);
      if (currentUser?.uid && !initTriggeredRef.current) {
        initTriggeredRef.current = true;
        loadUserPlan(currentUser.uid)
          .then((existingPlan) => {
            if (!isMounted) {
              return;
            }
            const isFirstVisit = existingPlan === null;
            setIsNew(isFirstVisit);
            logPlanEvent('auth_complete', { uid: currentUser.uid, isNew: isFirstVisit });

            if (isFirstVisit) {
              saveUserPlan(currentUser.uid, {
                eventType: 'wedding',
                budget: [],
                timeline: [],
                vendors: [],
                chatHistory: [],
                lastUpdated: Date.now(),
              }).catch(() => {
                // Background plan initialization
              });
            }
          })
          .catch(() => {
            if (isMounted) {
              setIsNew(false);
            }
          })
          .finally(() => {
            if (isMounted) {
              setLoading(false);
            }
          });
      } else if (!currentUser) {
        setLoading(false);
      }
    });

    signInAnonymouslySafe().catch((err: unknown) => {
      if (isMounted) {
        setError(err instanceof Error ? err : new AuthError('Authentication failed'));
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      initTriggeredRef.current = false;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign out failed';
      throw new AuthError(message);
    }
  }, []);

  return { user, loading, error, isNew, signOut };
};
