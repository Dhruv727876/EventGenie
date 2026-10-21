/**
 * @module EventGenie/TimelineViewTest
 * @description Unit tests for the TimelineView component verifying chronological sorting, checkboxes, and overdue warnings
 * @version 1.0.0
 * @license MIT
 */

// --- External Dependencies ---
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// --- Internal Modules ---
import { TimelineMilestone } from '../types';

// --- Components ---
import { TimelineView } from '../components/TimelineView';

jest.mock('../firebase', () => ({
  logPlanEvent: jest.fn(),
}));

const sampleMilestones: TimelineMilestone[] = [
  {
    id: 'mile-2',
    title: 'Select Wedding Cake Flavor',
    dueDate: '2030-08-15',
    completed: false,
    notes: 'Schedule tasting appointment',
  },
  {
    id: 'mile-1',
    title: 'Finalize Venue Contract',
    dueDate: '2030-05-01',
    completed: true,
    notes: 'Deposit paid',
  },
  {
    id: 'mile-3',
    title: 'Send Invitations',
    dueDate: '2020-01-01', // Past due date
    completed: false,
    notes: 'Address labels printed',
  },
];

describe('TimelineView component', () => {
  it('renders milestones sorted by date', () => {
    render(
      <TimelineView
        milestones={sampleMilestones}
        percentComplete={33}
        onToggleComplete={jest.fn()}
        onAddMilestone={jest.fn()}
        onRemoveMilestone={jest.fn()}
      />
    );

    const titles = screen.getAllByRole('checkbox').map((el) => {
      const label = el.getAttribute('aria-label');
      return label ? label.replace('Mark ', '').replace(' as complete', '') : '';
    });

    // 2020-01-01 comes before 2026-05-01 which comes before 2026-08-15
    expect(titles).toEqual([
      'Send Invitations',
      'Finalize Venue Contract',
      'Select Wedding Cake Flavor',
    ]);
  });

  it('checkbox toggles completion status', () => {
    const handleToggle = jest.fn();

    render(
      <TimelineView
        milestones={sampleMilestones}
        percentComplete={33}
        onToggleComplete={handleToggle}
        onAddMilestone={jest.fn()}
        onRemoveMilestone={jest.fn()}
      />
    );

    const cakeCheckbox = screen.getByRole('checkbox', { name: 'Mark Select Wedding Cake Flavor as complete' });
    fireEvent.click(cakeCheckbox);

    expect(handleToggle).toHaveBeenCalledWith('mile-2');
  });

  it('shows overdue indicator for past-due items', () => {
    render(
      <TimelineView
        milestones={sampleMilestones}
        percentComplete={33}
        onToggleComplete={jest.fn()}
        onAddMilestone={jest.fn()}
        onRemoveMilestone={jest.fn()}
      />
    );

    const overdueAlert = screen.getByRole('alert');
    expect(overdueAlert).toBeInTheDocument();
    expect(overdueAlert).toHaveTextContent('Overdue');
  });
});
