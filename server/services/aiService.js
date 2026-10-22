/**
 * @module EventGenie/AIService
 * @description Master AI orchestrator: Primary: Gemini 2.5 Flash | Fallback: NVIDIA NIM (DeepSeek V4.1 Flash)
 * @version 1.0.0
 * @license MIT
 */

const geminiService = require('./geminiService');
const fallbackService = require('./fallbackService');

/**
 * Orchestrates AI response generation: Primary: Gemini 2.5 Flash | Fallback: NVIDIA NIM (DeepSeek V4.1 Flash)
 * @param {string} eventType - The event persona type ('wedding', 'birthday', 'community')
 * @param {string} userMessage - Prompt query from the user
 * @param {Array<object>} [chatHistory=[]] - Chronological conversation history
 * @returns {Promise<{reply: string, sources: Array<string>, nextAction: string}>}
 */
async function getAIResponse(eventType, userMessage, chatHistory = []) {
  try {
    // 1. Try geminiService.generateResponse()
    return await geminiService.generateResponse(eventType, userMessage, chatHistory);
  } catch (_geminiError) {
    try {
      // 2. On failure -> try fallbackService.generateResponse() (real NVIDIA call)
      return await fallbackService.generateResponse(eventType, userMessage, chatHistory);
    } catch (_fallbackError) {
      // 3. On failure -> return static error message
      return {
        reply: 'We are currently experiencing high demand and our AI services are temporarily unavailable. Please try again in a few moments.',
        sources: [],
        nextAction: 'Retry your request in a few moments.',
      };
    }
  }
}

module.exports = {
  getAIResponse,
};
