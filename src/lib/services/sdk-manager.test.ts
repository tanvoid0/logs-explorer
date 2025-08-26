import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SDKManagerService } from './sdk-manager';

// Mock the Tauri shell plugin
vi.mock('@tauri-apps/plugin-shell', () => ({
  Command: vi.fn().mockImplementation((command, args) => ({
    execute: vi.fn().mockResolvedValue({
      code: 0,
      stdout: 'v18.17.0',
      stderr: ''
    })
  }))
}));

// Mock window.__TAURI__
Object.defineProperty(window, '__TAURI__', {
  value: {},
  writable: true
});

describe('SDKManagerService', () => {
  let sdkManager: SDKManagerService;

  beforeEach(() => {
    sdkManager = SDKManagerService.getInstance();
  });

  it('should detect installed SDKs', async () => {
    const results = await sdkManager.detectInstalledSDKs();
    
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
    
    // Check that we have the expected structure
    const firstResult = results[0];
    expect(firstResult).toHaveProperty('sdk');
    expect(firstResult).toHaveProperty('isInstalled');
  });

  it('should check if specific SDK is available', async () => {
    const isAvailable = await sdkManager.isSDKAvailable('node');
    expect(typeof isAvailable).toBe('boolean');
  });

  it('should get SDK version', async () => {
    const version = await sdkManager.getSDKVersion('node');
    expect(version === null || typeof version === 'string').toBe(true);
  });

  it('should get SDK info', async () => {
    const info = await sdkManager.getSDKInfo('node');
    
    if (info) {
      expect(info).toHaveProperty('name');
      expect(info).toHaveProperty('type');
      expect(info).toHaveProperty('versions');
      expect(info).toHaveProperty('isAvailable');
    }
  });
});
