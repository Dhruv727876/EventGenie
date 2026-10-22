/**
 * @module EventGenie/Firebase
 * @description Firebase services initialization, Firestore persistence, and Analytics telemetry
 * @version 1.0.0
 * @license MIT
 */

// --- External Dependencies ---
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, User, Auth, NextOrObserver } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, Firestore } from 'firebase/firestore';
import type { Analytics, logEvent as LogEventFn } from 'firebase/analytics';

// --- Internal Modules ---
import { PlanData, ChatMessage, BudgetItem, isPlanData, isRecord } from './types';

// --- Utilities ---
import { AuthError, DataError } from './utils/errors';
import { log } from './utils/logger';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

/** Initialized Firebase application instance */
export const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

/** Firebase Authentication service instance */
export const auth: Auth = getAuth(app);

/** Cloud Firestore database service instance */
export const db: Firestore = getFirestore(app);

/** Cloud Firestore collection reference helper */
export { collection };

let analyticsInstance: Analytics | null = null;
let logEventFn: typeof LogEventFn | null = null;

/**
 * Initializes Firebase Analytics lazily after mount to minimize initial bundle payload.
 * @param appInstance - The initialized Firebase application instance
 * @returns Resolves when analytics initialization succeeds or fails gracefully
 */
export const initAnalytics = async (appInstance: FirebaseApp): Promise<void> => {
  try {
    if (typeof window !== 'undefined') {
      const { getAnalytics, logEvent } = await import('firebase/analytics');
      analyticsInstance = getAnalytics(appInstance);
      logEventFn = logEvent;
    }
  } catch (_e) {
    analyticsInstance = null;
    logEventFn = null;
  }
};

/** Firebase Analytics instance if supported in current runtime */
export const analytics: Analytics | null = analyticsInstance;

/** Signs in user anonymously using Firebase Auth with resilient error handling */
export const signInAnonymouslySafe = async (): Promise<User> => {
  try {
    const userCredential = await signInAnonymously(auth);
    return userCredential.user;
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Anonymous authentication failed';
    throw new AuthError(errorMsg);
  }
};

/** Listens to Firebase authentication state changes */
export const onAuthStateChangedListener = (
  callback: NextOrObserver<User | null>
): (() => void) => {
  return onAuthStateChanged(auth, callback);
};

/** Persists or merges user planning data into Firestore with merge enabled */
export const saveUserPlan = async (uid: string, planData: Partial<PlanData>): Promise<void> => {
  try {
    const userDocRef = doc(db, 'users', uid);
    await setDoc(userDocRef, planData, { merge: true });
    logPlanEvent('plan_saved_to_firestore', { uid, fieldsCount: Object.keys(planData).length });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to save plan to Firestore';
    throw new DataError(errorMsg);
  }
};

/** Retrieves persisted user plan data from Firestore */
export const loadUserPlan = async (uid: string): Promise<PlanData | null> => {
  try {
    const userDocRef = doc(db, 'users', uid);
    const snapshot = await getDoc(userDocRef);
    if (!snapshot.exists()) {
      return null;
    }
    const rawData: unknown = snapshot.data();
    if (isPlanData(rawData)) {
      logPlanEvent('plan_loaded_from_firestore', { uid });
      return rawData;
    }
    // Partial plan fallback without using as type assertion
    if (isRecord(rawData)) {
      logPlanEvent('plan_loaded_from_firestore', { uid });
      const sanitizedPlan: PlanData = {
        eventType: rawData.eventType === 'birthday' || rawData.eventType === 'community' ? rawData.eventType : 'wedding',
        budget: Array.isArray(rawData.budget) ? rawData.budget.filter((b): b is BudgetItem => isRecord(b) && typeof b.id === 'string') : [],
        timeline: Array.isArray(rawData.timeline) ? rawData.timeline.filter((t): t is PlanData['timeline'][number] => isRecord(t) && typeof t.id === 'string') : [],
        vendors: Array.isArray(rawData.vendors) ? rawData.vendors.filter((v): v is PlanData['vendors'][number] => isRecord(v) && typeof v.id === 'string') : [],
        chatHistory: Array.isArray(rawData.chatHistory) ? rawData.chatHistory.filter((c): c is ChatMessage => isRecord(c) && typeof c.id === 'string') : [],
        lastUpdated: typeof rawData.lastUpdated === 'number' ? rawData.lastUpdated : Date.now(),
      };
      return sanitizedPlan;
    }
    return null;
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to load plan from Firestore';
    throw new DataError(errorMsg);
  }
};

/** Saves the complete event plan to Firestore under the user's UID */
export const saveFullPlan = async (uid: string, plan: PlanData): Promise<void> => {
  return saveUserPlan(uid, plan);
};

/** Loads the complete event plan from Firestore, returns null if no plan exists */
export const loadFullPlan = async (uid: string): Promise<PlanData | null> => {
  return loadUserPlan(uid);
};

/** Saves only the chat history in a sub-document for efficiency */
export const saveChatHistory = async (uid: string, messages: ChatMessage[]): Promise<void> => {
  try {
    const chatDocRef = doc(db, 'users', uid, 'data', 'chat');
    await setDoc(chatDocRef, { messages, lastUpdated: Date.now() }, { merge: true });
    logPlanEvent('plan_saved_to_firestore', { type: 'chat_subdoc' });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to save chat history';
    throw new DataError(errorMsg);
  }
};

/** Loads chat history from Firestore */
export const loadChatHistory = async (uid: string): Promise<ChatMessage[]> => {
  try {
    const chatDocRef = doc(db, 'users', uid, 'data', 'chat');
    const snapshot = await getDoc(chatDocRef);
    if (!snapshot.exists()) {
      return [];
    }
    const data: unknown = snapshot.data();
    if (isRecord(data) && Array.isArray(data.messages)) {
      return data.messages.filter((m): m is ChatMessage => isRecord(m) && typeof m.content === 'string');
    }
    return [];
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to load chat history';
    throw new DataError(errorMsg);
  }
};

/** Updates a single budget item without overwriting the entire plan */
export const updateBudgetItem = async (uid: string, item: BudgetItem): Promise<void> => {
  try {
    const itemDocRef = doc(db, 'users', uid, 'budget', item.id);
    await setDoc(itemDocRef, item, { merge: true });
    logPlanEvent('budget_item_updated', { itemId: item.id, category: item.category });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to update budget item';
    throw new DataError(errorMsg);
  }
};

/** Records a planning milestone completion event */
export const recordMilestoneCompletion = async (uid: string, milestoneId: string): Promise<void> => {
  try {
    const milestoneDocRef = doc(db, 'users', uid, 'milestones', milestoneId);
    await setDoc(milestoneDocRef, { completed: true, completedAt: Date.now() }, { merge: true });
    logPlanEvent('timeline_milestone_completed', { milestoneId });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to record milestone completion';
    throw new DataError(errorMsg);
  }
};

/**
 * Logs a structured analytics event to Firebase Analytics.
 * @param eventName - The event identifier (e.g., 'plan_created', 'budget_updated')
 * @param eventParams - Optional key-value pairs for event context
 * @description Wraps Firebase logEvent with error handling and dev logging.
 *   Must be called on minimum 10 distinct user actions across the app.
 */
export const logPlanEvent = (
  eventName: string,
  eventParams?: Record<string, string | number | boolean>
): void => {
  try {
    log(`Analytics Event: ${eventName}`, eventParams);
    if (logEventFn !== null && analyticsInstance !== null) {
      try {
        logEventFn(analyticsInstance, eventName, eventParams);
      } catch (_err) {
        // Analytics network or installation failure caught gracefully
      }
    }
  } catch (_err) {
    // Telemetry error fallback
  }
};
