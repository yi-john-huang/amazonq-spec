// Jest setup file for test configuration
import { jest } from '@jest/globals';

// Setup global test environment
beforeAll(() => {
  // Mock console methods in tests to reduce noise
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  // Restore console methods after tests
  jest.restoreAllMocks();
});

// Global test timeout
jest.setTimeout(10000);