/**
 * @module EventGenie/GeminiService
 * @description Google Generative AI integration using gemini-2.5-flash with timeout and persona system prompts
 * @version 1.0.0
 * @license MIT
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { AI_TIMEOUT_MS } = require('../utils/constants');
const { AIServiceError } = require('../utils/errors');

/**
 * Builds the system instruction prompt tailored to the requested event persona
 * @param {string} eventType - The category of event ('wedding', 'birthday', 'community', etc.)
 * @returns {string} The fully formed system prompt
 */
function buildSystemPrompt(eventType) {
  let pillars = '';

  switch (eventType) {
    case 'wedding':
      pillars = `
1. Venue selection & contract negotiation
2. Catering & dietary coordination
3. Photography & cinematography logistics
4. Floral design & environmental styling
5. Entertainment & ceremony audio/visual
6. Guest management & seating arrangements
7. Legal requirements & marriage licensing
8. Day-of coordination & emergency timeline`;
      break;

    case 'birthday':
      pillars = `
1. Theme development & age-appropriate styling
2. Venue booking & noise permits
3. Catering, beverages & custom cake design
4. Decorations, balloons & scenic backdrops
5. Entertainment, performers & interactive games
6. Invitations, digital RSVPs & guest communication
7. Party favors & commemorative gift bags
8. Age-appropriate activities & timeline coordination`;
      break;

    case 'community':
      pillars = `
1. Public venue selection & municipal accessibility compliance
2. Local council permits, safety codes & liability insurance
3. Volunteer recruitment, coordination & staff deployment
4. Budget allocation, sponsorships & municipal grant funding
5. Community marketing, press releases & digital outreach
6. Accessibility compliance, ADA standards & multilingual signage
7. Safety protocols, emergency response & first aid stations
8. Waste management, sanitation & post-event cleanup`;
      break;

    default:
      pillars = `
1. Goal alignment & event objective scoping
2. Venue sourcing & layout optimization
3. Budget allocation & vendor procurement
4. Attendee communication & registration tracking
5. Production schedules & supplier timelines
6. Day-of operational execution & risk management`;
      break;
  }

  return `You are EventGenie, an expert event planning assistant.

Your Knowledge Pillars for this event:
${pillars}

Hard Limits:
Never provide medical, legal, or financial advice beyond general planning guidance.

Output Format:
Your response MUST be valid JSON matching this schema:
{
  "reply": "Your main response text here with clear headings, ending with **Next Step:** [action]",
  "sources": ["Actual source 1", "Actual source 2"],
  "nextAction": "The single next step the user should take"
}
If you cannot cite real official sources, return "sources": [] — DO NOT fabricate sources.

Language:
Detect the user's language and respond in the same language.

Citations & Verification:
Cite official sources when providing regulatory or legal information. Include mandatory citations and verifiable reference guidelines for vendor cost estimates, typical timeframes, municipal regulations, and checklist recommendations.`;
}

/**
 * Generates an AI response for a user planning prompt using Gemini 2.5 Flash
 * @param {string} eventType - The event type persona
 * @param {string} userMessage - The current message from the user
 * @param {Array<object>} [chatHistory=[]] - Prior messages in the conversation
 * @returns {Promise<{reply: string, sources: Array<string>, nextAction: string}>}
 */
async function generateResponse(eventType, userMessage, chatHistory = []) {
  const apiKey = process.env.GEMINI_API_KEY || 'fake-gemini-key';
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: buildSystemPrompt(eventType),
  });

  const formattedHistory = chatHistory.slice(-10).map((msg) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));

  const chat = model.startChat({
    history: formattedHistory,
  });

  const aiPromise = (async () => {
    try {
      const result = await chat.sendMessage(userMessage);
      const rawText = result.response.text();

      try {
        const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
        const parsed = JSON.parse(cleaned);
        return {
          reply: parsed.reply || rawText,
          sources: Array.isArray(parsed.sources) ? parsed.sources : [],
          nextAction: parsed.nextAction || '',
        };
      } catch (_parseErr) {
        // If JSON parse fails, return raw text with empty sources
        return { reply: rawText, sources: [], nextAction: '' };
      }
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : 'Gemini generation failure';
      throw new AIServiceError(errMessage);
    }
  })();

  const timeoutPromise = new Promise((_, reject) => {
    const timer = setTimeout(() => {
      reject(new AIServiceError(`AI request timed out after ${AI_TIMEOUT_MS}ms`));
    }, AI_TIMEOUT_MS);
    if (typeof timer.unref === 'function') {
      timer.unref();
    }
  });

  return Promise.race([aiPromise, timeoutPromise]);
}

module.exports = {
  buildSystemPrompt,
  generateResponse,
};
