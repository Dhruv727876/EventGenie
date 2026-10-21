/**
 * @module EventGenie/AIService
 * @description Master AI orchestrator attempting primary Gemini 2.5 Flash and resiliently falling back to Gemma
 * @version 1.0.0
 * @license MIT
 */

const geminiService = require('./geminiService');
const gemmaService = require('./gemmaService');

/**
 * Orchestrates AI response generation with Gemini 2.5 Flash as primary and NVIDIA NIM Gemma as fallback
 * @param {string} eventType - The event persona type ('wedding', 'birthday', 'community')
 * @param {string} userMessage - Prompt query from the user
 * @param {Array<object>} [chatHistory=[]] - Chronological conversation history
 * @returns {Promise<{reply: string, sources: Array<string>, nextAction: string}>}
 */
async function getAIResponse(eventType, userMessage, chatHistory = []) {
  try {
    return await geminiService.generateResponse(eventType, userMessage, chatHistory);
  } catch (_geminiError) {
    // Primary Gemini call failed or timed out; seamlessly fallback to NVIDIA NIM Gemma stub
    return await gemmaService.generateResponse(eventType, userMessage, chatHistory);
  }
}

module.exports = {
  getAIResponse,
};
