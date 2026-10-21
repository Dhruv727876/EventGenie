/**
 * @module EventGenie/Constants
 * @description Domain constants, defaults, and templates for event planning
 * @version 1.0.0
 * @license MIT
 */

// --- Internal Modules ---
import { EventType } from '../types';
import {
  MAX_CHAT_INPUT_LENGTH,
  DEBOUNCE_DELAY_MS,
  AI_TIMEOUT_MS,
} from './limits';

/** Re-export limits for backwards compatibility and ease of access */
export * from './limits';

/** Configuration for event type selection cards */
export const EVENT_TYPE_CONFIG: {
  type: EventType;
  label: string;
  description: string;
  icon: string;
  color: string;
}[] = [
  {
    type: 'wedding',
    label: 'Dream Wedding',
    description: 'Orchestrate ceremonies, banquets, and vendor logistics effortlessly.',
    icon: '💒',
    color: 'rose',
  },
  {
    type: 'birthday',
    label: 'Milestone Birthday',
    description: 'Create memorable themes, activities, and celebrations for all ages.',
    icon: '🎂',
    color: 'amber',
  },
  {
    type: 'community',
    label: 'Community Gathering',
    description: 'Coordinate volunteers, public spaces, workshops, and local festivals.',
    icon: '🎪',
    color: 'emerald',
  },
];

/** Default budget categories by event persona */
export const DEFAULT_BUDGET_CATEGORIES: Record<EventType, string[]> = {
  wedding: ['Venue & Rentals', 'Catering & Bar', 'Photography & Video', 'Attire & Beauty', 'Florals & Decor', 'Music & Entertainment'],
  birthday: ['Venue Booking', 'Food & Cake', 'Decor & Balloons', 'Entertainment & Music', 'Party Favors', 'Invitations & Games'],
  community: ['Permits & Insurance', 'Staging & Audio/Visual', 'Refreshments & Food Trucks', 'Marketing & Signage', 'Waste Management & Sanitization', 'Volunteer Supplies'],
};

/** Default timeline milestone templates by event type */
export const TIMELINE_TEMPLATES: Record<EventType, { title: string; dueDateOffsetDays: number }[]> = {
  wedding: [
    { title: 'Lock down date and initial budget', dueDateOffsetDays: -180 },
    { title: 'Book ceremony and reception venue', dueDateOffsetDays: -150 },
    { title: 'Secure photographer and caterer', dueDateOffsetDays: -120 },
    { title: 'Send formal wedding invitations', dueDateOffsetDays: -60 },
    { title: 'Finalize RSVP count and seating chart', dueDateOffsetDays: -14 },
    { title: 'Host rehearsal and day-of coordination briefing', dueDateOffsetDays: -1 },
  ],
  birthday: [
    { title: 'Choose birthday party theme and set budget', dueDateOffsetDays: -45 },
    { title: 'Book venue or prepare home space', dueDateOffsetDays: -30 },
    { title: 'Send invitations and order customized cake', dueDateOffsetDays: -21 },
    { title: 'Purchase party favors and interactive games', dueDateOffsetDays: -7 },
    { title: 'Confirm final headcount with caterer', dueDateOffsetDays: -3 },
    { title: 'Setup decorations and sound system', dueDateOffsetDays: 0 },
  ],
  community: [
    { title: 'Form organizing committee and set event goals', dueDateOffsetDays: -90 },
    { title: 'Submit local council permits and reserve park/hall', dueDateOffsetDays: -60 },
    { title: 'Recruit community volunteers and sponsors', dueDateOffsetDays: -40 },
    { title: 'Launch social media outreach and print flyers', dueDateOffsetDays: -30 },
    { title: 'Confirm emergency protocol and equipment rentals', dueDateOffsetDays: -10 },
    { title: 'Conduct volunteer walk-through and site setup', dueDateOffsetDays: -1 },
  ],
};

/** Primary vendor service categories by event type */
export const VENDOR_CATEGORIES: Record<EventType, string[]> = {
  wedding: ['Venue', 'Catering', 'Photography', 'Florist', 'DJ / Live Band', 'Officiant'],
  birthday: ['Venue / Hall', 'Bakery / Cake', 'Entertainment / Magician', 'Balloons & Decor', 'Photographer', 'Party Rental'],
  community: ['City Facilities', 'Sound / Audio Engineering', 'Food Trucks', 'First Aid / Security', 'Waste Services', 'Equipment Rental'],
};

/** Backend API endpoints */
export const API_ENDPOINTS = {
  chat: '/api/chat',
  health: '/api/health',
  ideas: '/api/ideas',
};

/** User-friendly messages for rate limiting */
export const RATE_LIMIT_MESSAGES = {
  chat: 'You have reached the chat limit (20 requests per minute). Please wait a moment before sending another message.',
  ideas: 'You have reached the idea generator limit (15 requests per minute). Please wait a moment.',
  general: 'Too many requests. Please slow down and try again shortly.',
};

/** Maximum allowed character count for user text inputs */
export const MAX_INPUT_LENGTH = MAX_CHAT_INPUT_LENGTH;

/** Debounce delay for Firestore synchronization in milliseconds */
export const DEBOUNCE_MS = DEBOUNCE_DELAY_MS;

/** Default AI timeout in milliseconds */
export const DEFAULT_AI_TIMEOUT_MS = AI_TIMEOUT_MS;

/** Suggested prompt questions per event persona */
export const SUGGESTED_QUESTIONS: Record<EventType, string[]> = {
  wedding: [
    'What permits do I need for an outdoor wedding ceremony?',
    'How far in advance should I book our reception venue?',
    'How do I budget for catering and open bar costs?',
  ],
  birthday: [
    'What are trending themes for milestone adult birthdays?',
    'How to plan an unforgettable party on a tight budget?',
    'What entertainment options work best for mixed age guests?',
  ],
  community: [
    'What municipal insurance and sound permits do I need?',
    'How can our committee recruit and organize local volunteers?',
    'What are effective ways to secure neighborhood business sponsorships?',
  ],
};
