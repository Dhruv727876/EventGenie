/**
 * @module EventGenie/ChatInterfaceTest
 * @description Accessible chat interface unit tests verifying skip link, log region, and input submit
 * @version 1.0.0
 * @license MIT
 */

// --- External Dependencies ---
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// --- Internal Modules ---
import { ChatMessage } from '../types';

// --- Components ---
import { ChatInterface } from '../components/ChatInterface';

jest.mock('../firebase', () => ({
  logPlanEvent: jest.fn(),
}));

describe('ChatInterface component', () => {
  const sampleMessages: ChatMessage[] = [
    {
      id: 'msg-1',
      role: 'user',
      content: 'Can you recommend caterers?',
      timestamp: Date.now() - 5000,
    },
    {
      id: 'msg-2',
      role: 'assistant',
      content: 'I recommend looking into Artisan Catering for farm-to-table menus.',
      timestamp: Date.now() - 2000,
    },
  ];

  it('renders skip link first, verifies role="log" is present, and dispatches onSendMessage on input submit', () => {
    const handleSendMessage = jest.fn();

    render(
      <ChatInterface
        messages={sampleMessages}
        isLoading={false}
        error={null}
        onSendMessage={handleSendMessage}
        eventType="wedding"
      />
    );

    // Skip link first check
    const skipLink = screen.getByRole('link', { name: 'Skip to chat input' });
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#chat-input');

    // Role="log" present
    const logRegion = screen.getByRole('log');
    expect(logRegion).toBeInTheDocument();

    // Verify messages exist inside log
    expect(screen.getByText('Can you recommend caterers?')).toBeInTheDocument();
    expect(
      screen.getByText('I recommend looking into Artisan Catering for farm-to-table menus.')
    ).toBeInTheDocument();

    // Input dispatches callback
    const input = screen.getByLabelText('Type your planning question');
    fireEvent.change(input, { target: { value: 'What about wedding photography?' } });

    const sendButton = screen.getByLabelText('Send message');
    fireEvent.click(sendButton);

    expect(handleSendMessage).toHaveBeenCalledWith('What about wedding photography?');
  });
});
