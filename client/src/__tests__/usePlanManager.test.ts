/**
 * @module EventGenie/UsePlanManagerTest
 * @description Unit test suite for usePlanManager hook verifying message cycles, errors, and mutations
 * @version 1.0.0
 * @license MIT
 */

// --- External Dependencies ---
import { renderHook, act } from '@testing-library/react';

// --- Internal Modules ---
import { usePlanManager } from '../hooks/usePlanManager';

const mockSaveUserPlan = jest.fn().mockImplementation(() => Promise.resolve());
const mockLoadUserPlan = jest.fn().mockImplementation(() => Promise.resolve(null));
const mockLogPlanEvent = jest.fn();

jest.mock('../firebase', () => ({
  saveUserPlan: (...args: unknown[]) => mockSaveUserPlan(...args),
  loadUserPlan: (...args: unknown[]) => mockLoadUserPlan(...args),
  logPlanEvent: (...args: unknown[]) => mockLogPlanEvent(...args),
}));

describe('usePlanManager hook', () => {
  beforeEach(() => {
    mockSaveUserPlan.mockClear();
    mockLoadUserPlan.mockClear();
    mockLogPlanEvent.mockClear();
    mockSaveUserPlan.mockImplementation(() => Promise.resolve());
    mockLoadUserPlan.mockImplementation(() => Promise.resolve(null));
  });

  // Test 1: Initial state has empty messages
  it('initial state has empty messages', () => {
    const { result } = renderHook(() => usePlanManager());
    expect(result.current.messages).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.eventType).toBe('wedding');
  });

  // Test 2: sendMessage appends user message
  it('sendMessage appends user message', async () => {
    const mockReply = { reply: 'Here is your wedding venue recommendation.', sources: [], nextAction: 'Select a venue' };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockReply,
    });

    const { result } = renderHook(() => usePlanManager());

    await act(async () => {
      await result.current.sendMessage('Find a venue');
    });

    expect(result.current.messages.length).toBe(2);
    expect(result.current.messages[0]?.role).toBe('user');
    expect(result.current.messages[0]?.content).toBe('Find a venue');
    expect(result.current.messages[1]?.role).toBe('assistant');
    expect(result.current.messages[1]?.content).toBe(mockReply.reply);
  });

  // Test 3: Error state set on API failure
  it('error state set on API failure', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'AI service unavailable' }),
    });

    const { result } = renderHook(() => usePlanManager());

    await act(async () => {
      await result.current.sendMessage('Hello AI');
    });

    expect(result.current.error).toBe('AI service unavailable');
    expect(result.current.messages.length).toBe(1);
    expect(result.current.messages[0]?.role).toBe('user');
  });

  // Test 4: Empty input refused (no API call)
  it('empty input refused (no API call)', async () => {
    const mockFetch = jest.fn();
    global.fetch = mockFetch;

    const { result } = renderHook(() => usePlanManager());

    await act(async () => {
      await result.current.sendMessage('    ');
    });

    expect(mockFetch).not.toHaveBeenCalled();
    expect(result.current.messages).toEqual([]);
  });

  // Test 5: setEventType updates eventType
  it('setEventType updates eventType', () => {
    const { result } = renderHook(() => usePlanManager());

    act(() => {
      result.current.setEventType('community');
    });

    expect(result.current.eventType).toBe('community');
  });

  // Test 6: resetError clears error
  it('resetError clears error', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network failure'));

    const { result } = renderHook(() => usePlanManager());

    await act(async () => {
      await result.current.sendMessage('Test prompt');
    });

    expect(result.current.error).toBe('Network failure');

    act(() => {
      result.current.resetError();
    });

    expect(result.current.error).toBeNull();
  });

  // Test 7: Loading toggle during send
  it('loading toggle during send', async () => {
    let resolveFetch: (value: unknown) => void = () => {};
    const fetchPromise = new Promise((resolve) => {
      resolveFetch = resolve;
    });

    global.fetch = jest.fn().mockReturnValue(fetchPromise);

    const { result } = renderHook(() => usePlanManager());

    let sendPromise: Promise<void> | null = null;
    act(() => {
      sendPromise = result.current.sendMessage('Loading test message');
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolveFetch({
        ok: true,
        json: async () => ({ reply: 'Async reply', sources: [], nextAction: 'Done' }),
      });
      if (sendPromise) {
        await sendPromise;
      }
    });

    expect(result.current.isLoading).toBe(false);
  });

  // Test 8: Debounces Firestore writes
  it('debounces Firestore writes', () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => usePlanManager('user-123'));

    act(() => {
      result.current.setEventType('birthday');
    });

    expect(mockSaveUserPlan).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(mockSaveUserPlan).toHaveBeenCalledTimes(1);
    expect(mockSaveUserPlan).toHaveBeenCalledWith(
      'user-123',
      expect.objectContaining({ eventType: 'birthday' })
    );

    jest.useRealTimers();
  });

  // Test 9: Handles network timeout gracefully
  it('handles network timeout gracefully', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network request timed out'));

    const { result } = renderHook(() => usePlanManager('user-123'));

    await act(async () => {
      await result.current.sendMessage('Plan wedding catering');
    });

    expect(result.current.error).toBe('Network request timed out');
    expect(result.current.isLoading).toBe(false);
  });

  // Test 10: Persists chat history to Firestore on unmount
  it('persists chat history to Firestore on unmount', async () => {
    const mockReply = { reply: 'Saved response', sources: [], nextAction: 'Next' };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockReply,
    });

    const { result, unmount } = renderHook(() => usePlanManager('user-123'));

    await act(async () => {
      await result.current.sendMessage('Unmount test message');
    });

    mockSaveUserPlan.mockClear();

    act(() => {
      unmount();
    });

    expect(mockSaveUserPlan).toHaveBeenCalledWith(
      'user-123',
      expect.objectContaining({
        eventType: 'wedding',
      })
    );
  });
});
