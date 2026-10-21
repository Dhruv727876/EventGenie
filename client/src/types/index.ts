/**
 * @module EventGenie/Types
 * @description Domain models, interfaces, and type guards for EventGenie
 * @version 1.0.0
 * @license MIT
 */

/** Supported event types for planning */
export type EventType = 'wedding' | 'birthday' | 'community';

/** Single budget line item */
export interface BudgetItem {
  id: string;
  category: string;
  description: string;
  estimated: number;
  actual: number;
}

/** Timeline milestone */
export interface TimelineMilestone {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
  notes: string;
}

/** Vendor entry */
export interface Vendor {
  id: string;
  name: string;
  category: string;
  contact: string;
  status: 'pending' | 'contacted' | 'booked' | 'declined';
  cost: number;
}

/** Chat message */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

/** Full plan data stored in Firestore */
export interface PlanData {
  eventType: EventType;
  budget: BudgetItem[];
  timeline: TimelineMilestone[];
  vendors: Vendor[];
  chatHistory: ChatMessage[];
  lastUpdated: number;
}

/** User profile from auth */
export interface UserProfile {
  uid: string;
  isNew: boolean;
}

/** AI response shape from server */
export interface AIResponse {
  reply: string;
  sources: string[];
  nextAction: string;
}

/** Structured idea card generated for inspiration */
export interface EventIdea {
  id: string;
  title: string;
  description: string;
  estimatedCost: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
}

/**
 * Type guard verifying if an unknown value is a generic object record
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Type guard verifying if a value is a valid supported EventType
 */
export function isEventType(value: unknown): value is EventType {
  return value === 'wedding' || value === 'birthday' || value === 'community';
}

/**
 * Type guard checking if an unknown value satisfies the AIResponse contract
 */
export function isAIResponse(value: unknown): value is AIResponse {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.reply === 'string' &&
    Array.isArray(value.sources) &&
    typeof value.nextAction === 'string'
  );
}

/**
 * Type guard checking if an unknown value satisfies the BudgetItem contract
 */
export function isBudgetItem(value: unknown): value is BudgetItem {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.id === 'string' &&
    typeof value.category === 'string' &&
    typeof value.description === 'string' &&
    typeof value.estimated === 'number' &&
    typeof value.actual === 'number'
  );
}

/**
 * Type guard checking if an unknown value satisfies the TimelineMilestone contract
 */
export function isTimelineMilestone(value: unknown): value is TimelineMilestone {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.dueDate === 'string' &&
    typeof value.completed === 'boolean' &&
    typeof value.notes === 'string'
  );
}

/**
 * Type guard checking if an unknown value satisfies the Vendor contract
 */
export function isVendor(value: unknown): value is Vendor {
  if (!isRecord(value)) {
    return false;
  }
  const validStatus =
    value.status === 'pending' ||
    value.status === 'contacted' ||
    value.status === 'booked' ||
    value.status === 'declined';
  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.category === 'string' &&
    typeof value.contact === 'string' &&
    validStatus &&
    typeof value.cost === 'number'
  );
}

/**
 * Type guard checking if an unknown value satisfies the PlanData contract
 */
export function isPlanData(value: unknown): value is PlanData {
  if (!isRecord(value)) {
    return false;
  }
  return (
    isEventType(value.eventType) &&
    Array.isArray(value.budget) &&
    Array.isArray(value.timeline) &&
    Array.isArray(value.vendors) &&
    Array.isArray(value.chatHistory) &&
    typeof value.lastUpdated === 'number'
  );
}
