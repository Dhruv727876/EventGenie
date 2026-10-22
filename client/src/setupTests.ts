/**
 * @module EventGenie/SetupTests
 * @description Test environment setup configuration importing jest-dom extensions
 * @version 1.0.0
 * @license MIT
 */

import '@testing-library/jest-dom';

// Suppress known React 18.3 ReactDOMTestUtils deprecation warning triggered by @testing-library
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('ReactDOMTestUtils.act` is deprecated')
    ) {
      return;
    }
    originalError(...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
