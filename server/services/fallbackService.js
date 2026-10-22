/**
 * @module EventGenie/FallbackService
 * @description NVIDIA NIM (DeepSeek V4.1 Flash) fallback service
 * @version 1.0.0
 * @license MIT
 */

const { AI_TIMEOUT_MS } = require('../utils/constants');
const { AIServiceError } = require('../utils/errors');

/** NVIDIA NIM chat completions API endpoint */
const NVIDIA_API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';

/** DeepSeek model identifier on NVIDIA NIM */
const NVIDIA_MODEL = 'deepseek-ai/deepseek-v4.1-flash';

/**
 * Builds the fallback system instruction prompt for DeepSeek V4.1 Flash
 * @param {string} eventType - The category of event ('wedding', 'birthday', 'community', etc.)
 * @returns {string} The fully formed fallback system prompt
 */
function buildFallbackSystemPrompt(eventType) {
  let pillars = '';

  switch (eventType) {
    case 'wedding':
      pillars = 'Key pillars: venue, catering, photography, entertainment, guest management, coordination.';
      break;
    case 'birthday':
      pillars = 'Key pillars: theme, venue, cake, decorations, entertainment, activities.';
      break;
    case 'community':
      pillars = 'Key pillars: permits, venue, volunteers, budget, marketing, safety.';
      break;
    default:
      pillars = 'Key pillars: goals, venue, budget, attendees, timeline, execution.';
      break;
  }

  return `You are EventGenie, an expert event planning assistant.
You are a highly capable planning AI. Provide detailed, structured responses.
${pillars}
Provide practical, actionable advice.
End every response with exactly ONE concrete next step: **Next Step:** [action]
Respond in the user's language.`;
}

/**
 * Generates an AI fallback response using NVIDIA NIM (DeepSeek V4.1 Flash)
 * @param {string} eventType - The event persona type ('wedding', 'birthday', 'community')
 * @param {string} userMessage - Prompt query from the user
 * @param {Array<object>} [chatHistory=[]] - Chronological conversation history
 * @returns {Promise<{reply: string, sources: Array<string>, nextAction: string}>}
 */
async function generateResponse(eventType, userMessage, chatHistory = []) {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    throw new AIServiceError('NVIDIA_API_KEY is not configured');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, AI_TIMEOUT_MS);
  if (typeof timer.unref === 'function') {
    timer.unref();
  }

  const formattedHistory = chatHistory.slice(-10).map((msg) => ({
    role: msg.role === 'assistant' ? 'assistant' : 'user',
    content: msg.content,
  }));

  const messages = [
    { role: 'system', content: buildFallbackSystemPrompt(eventType) },
    ...formattedHistory,
    { role: 'user', content: userMessage },
  ];

  const apiPromise = (async () => {
    try {
      const response = await fetch(NVIDIA_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: NVIDIA_MODEL,
          messages,
          temperature: 0.7,
          max_tokens: 1024,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new AIServiceError(`NVIDIA NIM API responded with status ${response.status}`);
      }

      const data = await response.json();
      const rawText = data?.choices?.[0]?.message?.content || '';

      clearTimeout(timer);

      return parseAIResponse(rawText);
    } catch (err) {
      clearTimeout(timer);
      if (err.name === 'AbortError') {
        throw new AIServiceError(`NVIDIA NIM request timed out after ${AI_TIMEOUT_MS}ms`);
      }
      if (err instanceof AIServiceError) {
        throw err;
      }
      const msg = err instanceof Error ? err.message : 'Unknown NVIDIA NIM error';
      throw new AIServiceError(msg);
    }
  })();

  const timeoutPromise = new Promise((_, reject) => {
    const timeoutTimer = setTimeout(() => {
      reject(new AIServiceError(`NVIDIA NIM fallback request timed out after ${AI_TIMEOUT_MS}ms`));
    }, AI_TIMEOUT_MS);
    if (typeof timeoutTimer.unref === 'function') {
      timeoutTimer.unref();
    }
  });

  return Promise.race([apiPromise, timeoutPromise]);
}

/**
 * Extracts clean text from a potentially JSON-wrapped AI response.
 * Handles markdown code fences, raw JSON, and plain text.
 * @param {string} rawText - The raw response from the AI model
 * @returns {{reply: string, sources: Array<string>, nextAction: string}}
 */
function parseAIResponse(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return { reply: '', sources: [], nextAction: '' };
  }

  // Step 1: Strip markdown code fences if present
  let cleaned = rawText.trim();
  const codeFenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeFenceMatch) {
    cleaned = codeFenceMatch[1].trim();
  }

  // Step 2: Try to find and parse JSON object
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.reply && typeof parsed.reply === 'string') {
        return {
          reply: parsed.reply,
          sources: Array.isArray(parsed.sources) ? parsed.sources : [],
          nextAction: typeof parsed.nextAction === 'string' ? parsed.nextAction : '',
        };
      }
    } catch {
      // JSON parse failed — continue to plain text extraction
    }
  }

  // Step 3: Extract Next Step from plain text if present
  const nextStepMatch = rawText.match(/\*\*Next Step:\*\*\s*(.+)/i);

  // Step 4: Return cleaned plain text (strip any remaining JSON artifacts)
  const plainText = cleaned
    .replace(/^\{[\s\S]*"reply"\s*:\s*"/, '')
    .replace(/",\s*"sources"[\s\S]*$/, '')
    .trim();

  return {
    reply: plainText || rawText,
    sources: [],
    nextAction: nextStepMatch ? nextStepMatch[1].trim() : '',
  };
}

module.exports = {
  buildFallbackSystemPrompt,
  generateResponse,
  parseAIResponse,
  NVIDIA_MODEL,
};
