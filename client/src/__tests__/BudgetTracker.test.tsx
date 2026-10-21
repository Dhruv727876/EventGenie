/**
 * @module EventGenie/BudgetTrackerTest
 * @description Unit tests for the BudgetTracker component covering calculations, alerts, and item callbacks
 * @version 1.0.0
 * @license MIT
 */

// --- External Dependencies ---
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// --- Internal Modules ---
import { BudgetItem } from '../types';

// --- Components ---
import { BudgetTracker } from '../components/BudgetTracker';

jest.mock('../firebase', () => ({
  logPlanEvent: jest.fn(),
}));

const sampleItems: BudgetItem[] = [
  {
    id: 'item-1',
    category: 'Venue',
    description: 'Grand Ballroom Deposit',
    estimated: 5000,
    actual: 5200,
    paid: true,
  },
  {
    id: 'item-2',
    category: 'Catering',
    description: 'Plated Dinner Service',
    estimated: 3000,
    actual: 2800,
    paid: false,
  },
];

describe('BudgetTracker component', () => {
  it('renders default budget categories', () => {
    render(
      <BudgetTracker
        items={sampleItems}
        totalEstimated={8000}
        totalActual={8000}
        percentageUsed={100}
        categoryPercentages={{ Venue: 65, Catering: 35 }}
        onAddItem={jest.fn()}
      />
    );

    expect(screen.getByText('Venue')).toBeInTheDocument();
    expect(screen.getByText('Catering')).toBeInTheDocument();
    expect(screen.getByText('Grand Ballroom Deposit')).toBeInTheDocument();
    expect(screen.getByText('Plated Dinner Service')).toBeInTheDocument();
  });

  it('calculates total correctly', () => {
    render(
      <BudgetTracker
        items={sampleItems}
        totalEstimated={8000}
        totalActual={8000}
        percentageUsed={100}
        categoryPercentages={{ Venue: 65, Catering: 35 }}
        onAddItem={jest.fn()}
      />
    );

    expect(screen.getAllByText('$8,000')).toHaveLength(2);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('shows over-budget warning when actual > estimated', () => {
    render(
      <BudgetTracker
        items={sampleItems}
        totalEstimated={8000}
        totalActual={10000}
        percentageUsed={125}
        categoryPercentages={{ Venue: 70, Catering: 30 }}
        onAddItem={jest.fn()}
      />
    );

    const alertElement = screen.getByRole('alert');
    expect(alertElement).toBeInTheDocument();
    expect(alertElement).toHaveTextContent(/actual spending exceeds/i);
  });

  it('add item button dispatches callback', () => {
    const handleAddItem = jest.fn();

    render(
      <BudgetTracker
        items={sampleItems}
        totalEstimated={8000}
        totalActual={8000}
        percentageUsed={100}
        categoryPercentages={{ Venue: 65, Catering: 35 }}
        onAddItem={handleAddItem}
      />
    );

    const categoryInput = screen.getByPlaceholderText('e.g. Venue');
    const descriptionInput = screen.getByPlaceholderText('e.g. Grand Ballroom Deposit');
    const estimatedInput = screen.getByPlaceholderText('1500');

    fireEvent.change(categoryInput, { target: { value: 'Photography' } });
    fireEvent.change(descriptionInput, { target: { value: 'Wedding Album' } });
    fireEvent.change(estimatedInput, { target: { value: '1800' } });

    const submitBtn = screen.getByRole('button', { name: 'Add budget item' });
    fireEvent.click(submitBtn);

    expect(handleAddItem).toHaveBeenCalledWith('Photography', 'Wedding Album', 1800, 0);
  });
});
