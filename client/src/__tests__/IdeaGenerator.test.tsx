/**
 * @module EventGenie/IdeaGeneratorTest
 * @description Unit tests verifying idea rendering, fieldset accessibility, and click handling
 * @version 1.0.0
 * @license MIT
 */

// --- External Dependencies ---
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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
});
