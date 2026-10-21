/**
 * @module EventGenie/UsePlanManager
 * @description Master plan manager hook orchestrating event persona state and AI chat workflows
 * @version 1.0.0
 * @license MIT
 */

// --- External Dependencies ---
import { useState, useRef, useEffect, useCallback } from 'react';

// --- Internal Modules ---
import { ChatMessage, EventType, isAIResponse, isRecord } from '../types';
import { API_ENDPOINTS } from '../constants';
import { DEBOUNCE_DELAY_MS } from '../constants/limits';
import { saveUserPlan, loadUserPlan, logPlanEvent } from '../firebase';

// --- Utilities ---
import { generateId } from '../utils/helpers';
import { AIServiceError, ValidationError } from '../utils/errors';

/** Return signature for the usePlanManager hook */
export interface UsePlanManagerReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  eventType: EventType;
  sendMessage: (messageText: string) => Promise<void>;
  setEventType: (type: EventType) => void;
  resetError: () => void;
  hasLoaded: boolean;
}

/**
 * Primary hook orchestrating planning chat messages, event persona state,
 * and debounced Firestore synchronization.
 */
export const usePlanManager = (userId?: string): UsePlanManagerReturn => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [eventType, setEventTypeState] = useState<EventType>('wedding');
  const [hasLoaded, setHasLoaded] = useState<boolean>(false);

  const hasLoadedRef = useRef<boolean>(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentPlanRef = useRef<{ messages: ChatMessage[]; eventType: EventType }>({
    messages,
    eventType,
  });

  currentPlanRef.current = { messages, eventType };

  // Guarded Firestore read - fetch exactly once per session
  useEffect(() => {
    const shouldSkipFetch = !userId || hasLoadedRef.current;
    if (shouldSkipFetch) {
      return;
    }
    hasLoadedRef.current = true;

    loadUserPlan(userId)
      .then((savedData) => {
        if (savedData) {
          const hasChatHistory = savedData.chatHistory.length > 0;
          if (hasChatHistory) {
            setMessages(savedData.chatHistory);
          }
          if (savedData.eventType) {
            setEventTypeState(savedData.eventType);
          }
        }
        setHasLoaded(true);
      })
      .catch((_err: unknown) => {
        setHasLoaded(true);
      });
  }, [userId]);

  // Debounced Firestore persistence helper
  const scheduleSave = useCallback(
    (newMessages: ChatMessage[], newEventType: EventType) => {
      if (!userId) {
        return;
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        saveUserPlan(userId, {
          eventType: newEventType,
          chatHistory: newMessages,
          lastUpdated: Date.now(),
        }).catch((_err: unknown) => {
          // resilient background save
        });
      }, DEBOUNCE_DELAY_MS);
    },
    [userId]
  );

  // Persists plan data on unmount if user is authenticated and messages exist
  useEffect(() => {
    return () => {
      if (userId && currentPlanRef.current.messages.length > 0) {
        saveUserPlan(userId, {
          eventType: currentPlanRef.current.eventType,
          chatHistory: currentPlanRef.current.messages,
          lastUpdated: Date.now(),
        }).catch((_err: unknown) => {
          // resilient background save on unmount
        });
      }
    };
  }, [userId]);

  /** Updates active event persona and persists changes */
  const setEventType = useCallback(
    (type: EventType): void => {
      setEventTypeState(type);
      logPlanEvent('event_type_selected', { eventType: type });
      scheduleSave(currentPlanRef.current.messages, type);
    },
    [scheduleSave]
  );

  /** Clears the current error state */
  const resetError = useCallback((): void => {
    setError(null);
  }, []);

  /** Sends a prompt to the planning assistant API and records user & assistant messages */
  const sendMessage = useCallback(
    async (messageText: string): Promise<void> => {
      const trimmed = messageText.trim();
      if (!trimmed) {
        return;
      }

      const userMsg: ChatMessage = {
        id: generateId(),
        role: 'user',
        content: trimmed,
        timestamp: Date.now(),
      };

      const updatedHistory = [...currentPlanRef.current.messages, userMsg];
      setMessages(updatedHistory);
      setIsLoading(true);
      setError(null);
      logPlanEvent('chat_message_sent', { length: trimmed.length, eventType });

      try {
        const baseUrl = process.env.REACT_APP_API_URL ?? '';
        const response = await fetch(`${baseUrl}${API_ENDPOINTS.chat}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: trimmed,
            eventType,
            chatHistory: updatedHistory,
          }),
        });

        const rawJson: unknown = await response.json().catch(() => ({}));

        if (!response.ok) {
          const errDetail = isRecord(rawJson) && typeof rawJson.error === 'string'
            ? rawJson.error
            : `Server responded with status ${response.status}`;
          if (response.status >= 500) {
            throw new AIServiceError(errDetail);
          }
          throw new ValidationError(errDetail);
        }

        const replyContent = isAIResponse(rawJson)
          ? rawJson.reply
          : 'I have recorded your planning requirements.';

        const assistantMsg: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: replyContent,
          timestamp: Date.now(),
        };

        logPlanEvent('chat_response_received', { eventType, length: replyContent.length });
        const finalHistory = [...updatedHistory, assistantMsg];
        setMessages(finalHistory);
        scheduleSave(finalHistory, eventType);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to reach EventGenie AI assistant';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [eventType, scheduleSave]
  );

  return {
    messages,
    isLoading,
    error,
    eventType,
    sendMessage,
    setEventType,
    resetError,
    hasLoaded,
  };
};
