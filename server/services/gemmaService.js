/**
 * @module EventGenie/GemmaService
 * @description Fallback AI service stub simulating NVIDIA NIM / Gemma inference
 * @version 1.0.0
 * @license MIT
 */

const { AI_TIMEOUT_MS } = require('../utils/constants');
const { AIServiceError } = require('../utils/errors');

/**
 * Builds the fallback system instruction prompt for Gemma on NVIDIA NIM
 * @param {string} eventType - The category of event
 * @returns {string} The fallback system prompt string
 */
function buildSystemPrompt(eventType) {
  return `You are EventGenie (Fallback Service powered by NVIDIA NIM / Gemma).
Specializing in ${eventType || 'general'} event coordination, checklists, and timelines.
End every response with exactly ONE concrete next action, formatted as: **Next Step:** [action]`;
}

/**
 * Generates an AI fallback response simulating an NVIDIA NIM / Gemma inference call
 * @param {string} eventType - The event persona type
 * @param {string} userMessage - The user input message
 * @param {Array<object>} [_chatHistory=[]] - Conversation message history
 * @returns {Promise<{reply: string, sources: Array<string>, nextAction: string}>}
 */
async function generateResponse(eventType, userMessage, _chatHistory = []) {
  const gemmaPromise = (async () => {
    const capitalized = (eventType || 'event').charAt(0).toUpperCase() + (eventType || 'event').slice(1);
    const reply = `[NVIDIA NIM / Gemma Fallback Mode]\n\n### ${capitalized} Planning Recommendations\nRegarding your inquiry: "${userMessage}"\n\n1. **Priority Task**: Outline the key constraints including date, venue capacity, and initial budget.\n2. **Checklist Milestone**: Inquire with essential suppliers at least 60-90 days prior to the date.\n3. **Guest Coordination**: Maintain an updated digital attendee roster.\n\n**Next Step:** Confirm your guest count and reserve the primary venue.`;

    const sources = [
      'NVIDIA NIM Event Planning Knowledge Base',
      'EventGenie Gemma Local Inference Fallback',
    ];

    const nextAction = 'Confirm your guest count and reserve the primary venue.';

    return {
      reply,
      sources,
      nextAction,
    };
  })();

  const timeoutPromise = new Promise((_, reject) => {
    const timer = setTimeout(() => {
      reject(new AIServiceError(`AI request timed out after ${AI_TIMEOUT_MS}ms`));
    }, AI_TIMEOUT_MS);
    if (typeof timer.unref === 'function') {
      timer.unref();
    }
  });

  return Promise.race([gemmaPromise, timeoutPromise]);
}

module.exports = {
  buildSystemPrompt,
  generateResponse,
};
