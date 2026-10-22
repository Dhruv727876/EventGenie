/**
 * @module EventGenie/EventTypeSelectorTest
 * @description Accessible radio card component tests for EventTypeSelector
 * @version 1.0.0
 * @license MIT
 */

// --- External Dependencies ---
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// --- Components ---
import { EventTypeSelector } from '../components/EventTypeSelector';

describe('EventTypeSelector component', () => {
  it('renders all 3 cards and click fires onSelect', () => {
    const handleSelect = jest.fn();

    render(
      <EventTypeSelector
        selectedType="wedding"
        onSelect={handleSelect}
      />
    );

    // Verify all 3 options exist
    expect(screen.getByText('Dream Wedding')).toBeInTheDocument();
    expect(screen.getByText('Milestone Birthday')).toBeInTheDocument();
    expect(screen.getByText('Community Gathering')).toBeInTheDocument();

    // Verify fieldset and legend exist
    const legend = screen.getByText('Choose Your Event Type');
    expect(legend).toBeInTheDocument();

    // Verify radio cards count
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(3);

    // Verify click fires onSelect
    fireEvent.click(screen.getByText('Milestone Birthday'));
    expect(handleSelect).toHaveBeenCalledWith('birthday');

    fireEvent.click(screen.getByText('Community Gathering'));
    expect(handleSelect).toHaveBeenCalledWith('community');
  });

  it('supports arrow key navigation', () => {
    const handleSelect = jest.fn();

    render(
      <EventTypeSelector
        selectedType="wedding"
        onSelect={handleSelect}
      />
    );

    const radios = screen.getAllByRole('radio');
    const firstRadio = radios[0];
    fireEvent.keyDown(firstRadio, { key: 'ArrowRight' });
    expect(handleSelect).toHaveBeenCalledWith('birthday');

    fireEvent.keyDown(firstRadio, { key: 'ArrowLeft' });
    expect(handleSelect).toHaveBeenCalledWith('community');
  });

  it('announces selection via aria-checked', () => {
    const { rerender } = render(
      <EventTypeSelector
        selectedType="wedding"
        onSelect={jest.fn()}
      />
    );

    const radios = screen.getAllByRole('radio');
    expect(radios[0]).toHaveAttribute('aria-checked', 'true');
    expect(radios[1]).toHaveAttribute('aria-checked', 'false');
    expect(radios[2]).toHaveAttribute('aria-checked', 'false');

    rerender(
      <EventTypeSelector
        selectedType="birthday"
        onSelect={jest.fn()}
      />
    );

    const updatedRadios = screen.getAllByRole('radio');
    expect(updatedRadios[0]).toHaveAttribute('aria-checked', 'false');
    expect(updatedRadios[1]).toHaveAttribute('aria-checked', 'true');
    expect(updatedRadios[2]).toHaveAttribute('aria-checked', 'false');
  });
});
