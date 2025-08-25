// Test setup file for Vitest
import { vi } from 'vitest';

// Mock Tauri API for testing
vi.mock('@tauri-apps/api', () => ({
  invoke: vi.fn(),
  app: {
    getVersion: vi.fn(() => Promise.resolve('1.0.0')),
    getName: vi.fn(() => Promise.resolve('Kubernetes Logs Explorer'))
  }
}));

// Mock browser APIs
Object.defineProperty(window, 'showOpenFilePicker', {
  value: vi.fn(),
  writable: true
});

// Global test utilities
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));
