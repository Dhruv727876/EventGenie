/**
 * @module EventGenie/ChatInterface
 * @description Accessible GenAI chat assistant interface with suggested prompt chips and autoscroll
 * @version 1.0.0
 * @license MIT
 */

// --- External Dependencies ---
import React, { useState, useMemo, useRef, useEffect, FormEvent, ChangeEvent } from 'react';

// --- Internal Modules ---
import { ChatMessage, EventType } from '../types';
import { SUGGESTED_QUESTIONS } from '../constants';
import { MAX_CHAT_INPUT_LENGTH } from '../constants/limits';
import { logPlanEvent } from '../firebase';

/** Props interface for the ChatInterface component */
export interface ChatInterfaceProps {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  onSendMessage: (text: string) => void;
  eventType: EventType;
}

const ChatInterfaceComponent: React.FC<ChatInterfaceProps> = ({
  messages,
  isLoading,
  error,
  onSendMessage,
  eventType,
}) => {
  const [inputText, setInputText] = useState<string>('');
  const logContainerRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isLoading) {
      return;
    }
    logPlanEvent('chat_message_sent', { length: trimmed.length, eventType });
    onSendMessage(trimmed);
    setInputText('');
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setInputText(e.target.value);
  };

  const handleChipClick = (question: string): void => {
    setInputText(question);
  };

  const currentQuestions = useMemo(() => {
    return SUGGESTED_QUESTIONS[eventType] ?? SUGGESTED_QUESTIONS.wedding;
  }, [eventType]);

  const renderedMessages = useMemo(() => {
    if (messages.length === 0) {
      return (
        <div className="text-center py-12 text-slate-400">
          <p className="text-sm">No messages yet. Ask EventGenie anything about your {eventType}!</p>
        </div>
      );
    }
    return messages.map((msg) => {
      const isUser = msg.role === 'user';
      return (
        <div
          key={msg.id}
          className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
        >
          <div
            aria-label={isUser ? 'User message' : 'Assistant response'}
            className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 text-sm leading-relaxed shadow-sm ${
              isUser
                ? 'bg-orange-500 text-white rounded-br-none'
                : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
            }`}
          >
            <div className="flex items-center space-x-2 mb-1">
              <span className="font-semibold text-xs opacity-90">
                {isUser ? 'You' : 'EventGenie AI'}
              </span>
              <span className="text-[10px] opacity-75">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="whitespace-pre-wrap">{msg.content}</div>
          </div>
        </div>
      );
    });
  }, [messages, eventType]);

  return (
    <section
      role="region"
      aria-label="Chat with EventGenie AI"
      className="bg-slate-50 border border-slate-200 rounded-2xl p-4 md:p-6 shadow-sm flex flex-col h-[640px]"
    >
      <a
        href="#chat-input"
        className="sr-only focus:not-sr-only focus:absolute focus:z-20 focus:p-2 focus:bg-orange-600 focus:text-white focus:rounded"
      >
        Skip to chat input
      </a>

      {/* Suggested Questions Chips */}
      <div className="mb-3 flex flex-wrap gap-2 items-center" aria-label="Suggested questions">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Suggested:</span>
        {currentQuestions.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => handleChipClick(q)}
            aria-label={`Ask suggested question: ${q}`}
            className="h-11 px-3 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:border-orange-400 hover:text-orange-600 rounded-xl transition-all shadow-2xs text-left"
          >
            {q}
          </button>
        ))}
      </div>

      <div
        ref={logContainerRef}
        role="log"
        aria-live="polite"
        className="flex-1 overflow-y-auto pr-2 mb-4 space-y-2 scroll-smooth"
        tabIndex={0}
        aria-label="Chat messages"
      >
        {renderedMessages}

        {isLoading && (
          <div
            role="status"
            aria-live="polite"
            className="flex items-center space-x-2 text-slate-500 text-sm py-2"
          >
            <div className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
            <span>AI is thinking...</span>
          </div>
        )}
      </div>

      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="p-3 mb-3 text-xs bg-red-100 border border-red-200 text-red-800 rounded-lg flex items-center justify-between"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => {
              if (inputText.trim()) {
                onSendMessage(inputText.trim());
              }
            }}
            className="h-11 px-3 font-semibold text-red-700 hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2 items-center">
        <input
          id="chat-input"
          type="text"
          value={inputText}
          onChange={handleInputChange}
          placeholder={`Ask about ${eventType} venues, timelines, budgeting...`}
          aria-label="Type your planning question"
          maxLength={MAX_CHAT_INPUT_LENGTH}
          disabled={isLoading}
          className="flex-1 h-11 px-4 text-sm bg-white border border-slate-300 rounded-xl focus:border-orange-500 focus:ring-1 focus:ring-orange-500 disabled:bg-slate-100"
        />
        <button
          type="submit"
          aria-label="Send message"
          disabled={isLoading || !inputText.trim()}
          className="h-11 px-6 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 rounded-xl transition-colors shadow-sm flex items-center justify-center min-w-[90px]"
        >
          Send
        </button>
      </form>
    </section>
  );
};

/**
 * Interactive GenAI planning chat interface with accessible log stream and input controls
 */
export const ChatInterface = React.memo(ChatInterfaceComponent);
