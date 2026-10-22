/**
 * @module EventGenie/IntegrationTests
 * @description End-to-end integration test suite verifying user planning flow across personas, chat, budget, and timeline
 * @version 1.0.0
 * @license MIT
 */

// --- External Dependencies ---
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// --- Components ---
import App from '../App';

// --- Mocks ---
const mockSaveUserPlan = jest.fn();
const mockLoadUserPlan = jest.fn();
const mockLogPlanEvent = jest.fn();
const mockRecordMilestoneCompletion = jest.fn();

jest.mock('../firebase', () => ({
  saveUserPlan: (...args: unknown[]) => mockSaveUserPlan(...args),
  loadUserPlan: (...args: unknown[]) => mockLoadUserPlan(...args),
  saveFullPlan: (...args: unknown[]) => mockSaveUserPlan(...args),
  loadFullPlan: (...args: unknown[]) => mockLoadUserPlan(...args),
  saveChatHistory: () => Promise.resolve(),
  recordMilestoneCompletion: (...args: unknown[]) => mockRecordMilestoneCompletion(...args),
  logPlanEvent: (...args: unknown[]) => mockLogPlanEvent(...args),
}));

jest.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { uid: 'integration-test-user' },
    loading: false,
    isNew: false,
  }),
}));

describe('EventGenie Core Planning Flow Integration', () => {
  beforeEach(() => {
    mockSaveUserPlan.mockReset();
    mockLoadUserPlan.mockReset();
    mockLogPlanEvent.mockReset();
    mockRecordMilestoneCompletion.mockReset();

    mockSaveUserPlan.mockImplementation(() => Promise.resolve());
    mockLoadUserPlan.mockImplementation(() => Promise.resolve(null));
    mockRecordMilestoneCompletion.mockImplementation(() => Promise.resolve());

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        reply: 'Detailed birthday itinerary with theme milestones and vendor recommendations.',
        sources: ['Official Party Guide'],
        nextAction: 'Finalize guest list and venue deposit',
      }),
    });
  });

  it('completes the entire planning workflow: select event type -> send chat -> add budget item -> complete milestone', async () => {
    render(<App />);

    // 1. Verify Event Type Selector renders and switch persona to Birthday
    const birthdayRadio = await screen.findByRole('radio', { name: /Birthday/i });
    expect(birthdayRadio).toBeInTheDocument();

    fireEvent.click(birthdayRadio);
    expect(birthdayRadio).toHaveAttribute('aria-checked', 'true');

    // 2. Chat interface is active on initial 'Plan' tab
    const chatInput = await screen.findByLabelText('Type your planning question');
    expect(chatInput).toBeInTheDocument();

    fireEvent.change(chatInput, { target: { value: 'Recommend a fun milestone theme' } });

    const sendButton = screen.getByLabelText('Send message');
    fireEvent.click(sendButton);

    // Verify AI response arrives and displays in the chat log
    await waitFor(() => {
      expect(
        screen.getByText('Detailed birthday itinerary with theme milestones and vendor recommendations.')
      ).toBeInTheDocument();
    });

    // 3. Switch to Budget Tab and add a budget item
    const budgetTab = screen.getByRole('tab', { name: 'Budget' });
    fireEvent.click(budgetTab);

    const descInput = await screen.findByLabelText('Description');
    const estInput = screen.getByLabelText('Estimated ($)');
    const addBudgetButton = screen.getByRole('button', { name: 'Add budget item' });

    fireEvent.change(descInput, { target: { value: 'Custom Birthday Cake' } });
    fireEvent.change(estInput, { target: { value: '350' } });
    fireEvent.click(addBudgetButton);

    await waitFor(() => {
      expect(screen.getByText('Custom Birthday Cake')).toBeInTheDocument();
    });

    // 4. Switch to Timeline Tab and mark milestone complete
    const timelineTab = screen.getByRole('tab', { name: 'Timeline' });
    fireEvent.click(timelineTab);

    const milestoneCheckboxes = await screen.findAllByRole('checkbox');
    expect(milestoneCheckboxes.length).toBeGreaterThan(0);

    const firstCheckbox = milestoneCheckboxes[0];
    expect(firstCheckbox).not.toBeChecked();

    fireEvent.click(firstCheckbox);
    expect(firstCheckbox).toBeChecked();
  });
});
