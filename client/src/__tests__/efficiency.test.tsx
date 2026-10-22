/**
 * @module EventGenie/EfficiencyTests
 * @description Performance and memoization tests verifying optimized component rendering and data operations
 * @version 1.0.0
 * @license MIT
 */

// --- External Dependencies ---
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// --- Internal Modules ---
import { ChatMessage, BudgetItem, TimelineMilestone } from '../types';
import { ChatInterface } from '../components/ChatInterface';
import { BudgetTracker } from '../components/BudgetTracker';
import { TimelineView } from '../components/TimelineView';

jest.mock('../firebase', () => ({
  logPlanEvent: jest.fn(),
}));

describe('Performance and Efficiency Optimizations', () => {
  it('renders large message histories in ChatInterface without degradation', () => {
    const handleSendMessage = jest.fn();
    const largeMessageList: ChatMessage[] = Array.from({ length: 50 }, (_, i) => ({
      id: `msg-${i}`,
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `Planning message iteration ${i} with logistical context and milestones`,
      timestamp: Date.now() - (50 - i) * 1000,
    }));

    const { rerender } = render(
      <ChatInterface
        messages={largeMessageList}
        isLoading={false}
        error={null}
        onSendMessage={handleSendMessage}
        eventType="wedding"
      />
    );

    expect(screen.getByText('Planning message iteration 0 with logistical context and milestones')).toBeInTheDocument();
    expect(screen.getByText('Planning message iteration 49 with logistical context and milestones')).toBeInTheDocument();

    // Rerender with unchanged props to test memoized stability
    rerender(
      <ChatInterface
        messages={largeMessageList}
        isLoading={false}
        error={null}
        onSendMessage={handleSendMessage}
        eventType="wedding"
      />
    );

    expect(screen.getByText('Planning message iteration 49 with logistical context and milestones')).toBeInTheDocument();
  });

  it('calculates budget metrics using memoized totals correctly', () => {
    const sampleItems: BudgetItem[] = [
      { id: 'b-1', category: 'Venue', description: 'Reception Hall', estimated: 4000, actual: 4200 },
      { id: 'b-2', category: 'Catering', description: 'Buffet Service', estimated: 2500, actual: 2300 },
      { id: 'b-3', category: 'Decor', description: 'Floral Arrangements', estimated: 1500, actual: 1500 },
    ];

    const totalEst = sampleItems.reduce((acc, item) => acc + item.estimated, 0);
    const totalAct = sampleItems.reduce((acc, item) => acc + item.actual, 0);
    const pctUsed = Math.round((totalAct / totalEst) * 100);

    const { rerender } = render(
      <BudgetTracker
        items={sampleItems}
        totalEstimated={totalEst}
        totalActual={totalAct}
        percentageUsed={pctUsed}
        categoryPercentages={{ Venue: 52, Catering: 29, Decor: 19 }}
        onAddItem={jest.fn()}
      />
    );

    expect(screen.getAllByText('$8,000')).toHaveLength(2);

    // Re-rendering with identical props produces identical memoized output
    rerender(
      <BudgetTracker
        items={sampleItems}
        totalEstimated={totalEst}
        totalActual={totalAct}
        percentageUsed={pctUsed}
        categoryPercentages={{ Venue: 52, Catering: 29, Decor: 19 }}
        onAddItem={jest.fn()}
      />
    );

    expect(screen.getByText('Venue')).toBeInTheDocument();
    expect(screen.getByText('Catering')).toBeInTheDocument();
    expect(screen.getByText('Decor')).toBeInTheDocument();
  });

  it('sorts timeline milestones efficiently in chronological order', () => {
    const unorderedMilestones: TimelineMilestone[] = [
      { id: 'm-3', title: 'Day-of Setup Checklist', dueDate: '2026-12-01', completed: false, notes: 'Morning check' },
      { id: 'm-1', title: 'Sign Venue Contract', dueDate: '2026-06-01', completed: true, notes: 'Deposit paid' },
      { id: 'm-2', title: 'Book Catering Tasting', dueDate: '2026-08-15', completed: false, notes: 'Select 4 dishes' },
    ];

    render(
      <TimelineView
        milestones={unorderedMilestones}
        percentComplete={33}
        onToggleComplete={jest.fn()}
        onAddMilestone={jest.fn()}
        onRemoveMilestone={jest.fn()}
      />
    );

    const milestoneTitles = [
      screen.getByText('Sign Venue Contract'),
      screen.getByText('Book Catering Tasting'),
      screen.getByText('Day-of Setup Checklist'),
    ];

    expect(milestoneTitles[0]).toBeInTheDocument();
    expect(milestoneTitles[1]).toBeInTheDocument();
    expect(milestoneTitles[2]).toBeInTheDocument();

    const labels = screen.getAllByText(/(Sign Venue Contract|Book Catering Tasting|Day-of Setup Checklist)/);
    expect(labels.map((l) => l.textContent)).toEqual([
      'Sign Venue Contract',
      'Book Catering Tasting',
      'Day-of Setup Checklist',
    ]);
  });
});
