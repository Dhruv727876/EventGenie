/**
 * @module EventGenie/GeminiTest
 * @description Gemini system prompt generation and fallback persona test suite
 * @version 1.0.0
 * @license MIT
 */

const { buildSystemPrompt } = require('../services/geminiService');

describe('geminiService - buildSystemPrompt', () => {
  it('buildSystemPrompt("wedding") contains wedding-specific pillars', () => {
    const prompt = buildSystemPrompt('wedding');
    expect(prompt).toContain('Venue selection');
    expect(prompt).toContain('Photography');
    expect(prompt).toContain('Floral design');
    expect(prompt).toContain('Day-of coordination');
  });

  it('buildSystemPrompt("birthday") contains birthday-specific pillars', () => {
    const prompt = buildSystemPrompt('birthday');
    expect(prompt).toContain('Theme development');
    expect(prompt).toContain('Venue booking');
    expect(prompt).toContain('Catering, beverages & custom cake design');
    expect(prompt).toContain('Party favors');
  });

  it('buildSystemPrompt includes mandatory citations instruction', () => {
    const prompt = buildSystemPrompt('wedding');
    expect(prompt.toLowerCase()).toContain('citation');
    expect(prompt.toLowerCase()).toContain('sources');
  });

  it('unknown persona defaults to generic event planning prompt', () => {
    const prompt = buildSystemPrompt('unknown-event-type');
    expect(prompt).toContain('Goal alignment');
    expect(prompt).toContain('Venue sourcing');
    expect(prompt).toContain('Budget allocation');
    expect(prompt).toContain('EventGenie');
  });

  it('buildSystemPrompt("community") contains community-specific pillars', () => {
    const prompt = buildSystemPrompt('community').toLowerCase();
    expect(prompt).toContain('permits');
    expect(prompt).toContain('volunteer');
    expect(prompt).toContain('safety');
    expect(prompt).toContain('accessibility');
  });

  it('buildSystemPrompt includes mandatory Next Step format instruction', () => {
    const prompt = buildSystemPrompt('wedding');
    expect(prompt).toContain('**Next Step:** [action]');
  });
});

describe('Fallback Service (NVIDIA NIM)', () => {
  it('buildFallbackSystemPrompt includes wedding pillars', () => {
    const { buildFallbackSystemPrompt } = require('../services/fallbackService');
    const prompt = buildFallbackSystemPrompt('wedding');
    expect(prompt).toContain('venue');
    expect(prompt).toContain('catering');
    expect(prompt).toContain('Next Step');
  });

  it('buildFallbackSystemPrompt includes community pillars', () => {
    const { buildFallbackSystemPrompt } = require('../services/fallbackService');
    const prompt = buildFallbackSystemPrompt('community');
    expect(prompt).toContain('permits');
    expect(prompt).toContain('volunteers');
  });

  it('uses deepseek-ai/deepseek-v4.1-flash model string', () => {
    const { NVIDIA_MODEL } = require('../services/fallbackService');
    expect(NVIDIA_MODEL).toBe('deepseek-ai/deepseek-v4.1-flash');
  });

  it('buildFallbackSystemPrompt includes DeepSeek structured planning directive', () => {
    const { buildFallbackSystemPrompt } = require('../services/fallbackService');
    const prompt = buildFallbackSystemPrompt('wedding');
    expect(prompt).toContain('You are a highly capable planning AI. Provide detailed, structured responses.');
  });

  it('generateResponse throws when NVIDIA_API_KEY is missing', async () => {
    const original = process.env.NVIDIA_API_KEY;
    delete process.env.NVIDIA_API_KEY;
    // Clear require cache to re-evaluate
    delete require.cache[require.resolve('../services/fallbackService')];
    const { generateResponse } = require('../services/fallbackService');
    await expect(generateResponse('wedding', 'test', []))
      .rejects.toThrow();
    process.env.NVIDIA_API_KEY = original;
  });
});
