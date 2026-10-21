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
