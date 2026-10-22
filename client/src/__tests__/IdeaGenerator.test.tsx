/**
 * @module EventGenie/IdeaGeneratorTest
 * @description Unit tests verifying idea rendering, fieldset accessibility, and click handling
 * @version 1.0.0
 * @license MIT
 */

// --- External Dependencies ---
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';

// --- Components ---
import { IdeaGenerator } from '../components/IdeaGenerator';

jest.mock('../firebase', () => ({
  logPlanEvent: jest.fn(),
}));

describe('IdeaGenerator component', () => {
  it('renders ideas, click fires handler, and fieldset is present', () => {
    const handleSelectIdea = jest.fn();

    render(
      <IdeaGenerator
        eventType="wedding"
        onSelectIdea={handleSelectIdea}
      />
    );

    // Verify region role exists
    const region = screen.getByRole('region', { name: 'Idea generator' });
    expect(region).toBeInTheDocument();

    // Verify fieldset and legend exist
    expect(screen.getByText('Select Idea Focus Area')).toBeInTheDocument();

    // Verify ideas render
    const useIdeaButtons = screen.getAllByRole('button', { name: /add .* to your plan/i });
    expect(useIdeaButtons.length).toBeGreaterThan(0);

    // Click fires handler
    const firstBtn = useIdeaButtons[0];
    if (firstBtn) {
      fireEvent.click(firstBtn);
      expect(handleSelectIdea).toHaveBeenCalledTimes(1);
    }
  });

  it('shows loading skeleton while generating', async () => {
    let resolvePromise: (value: unknown) => void = () => {};
    global.fetch = jest.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePromise = resolve;
        })
    );

    render(
      <IdeaGenerator
        eventType="wedding"
        onSelectIdea={jest.fn()}
      />
    );

    const generateBtn = screen.getByRole('button', { name: 'Generate new event ideas' });
    fireEvent.click(generateBtn);

    const skeleton = screen.getByRole('status');
    expect(skeleton).toBeInTheDocument();
    expect(screen.getByText('Generating ideas...')).toBeInTheDocument();

    // Clean up pending promise inside act
    await act(async () => {
      resolvePromise({
        ok: true,
        json: async () => ({ reply: 'Creative idea spark' }),
      });
      await Promise.resolve();
    });
  });

  it('displays error state on API failure', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    render(
      <IdeaGenerator
        eventType="wedding"
        onSelectIdea={jest.fn()}
      />
    );

    const generateBtn = screen.getByRole('button', { name: 'Generate new event ideas' });
    fireEvent.click(generateBtn);

    const errorAlert = await screen.findByRole('alert');
    expect(errorAlert).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });
});
