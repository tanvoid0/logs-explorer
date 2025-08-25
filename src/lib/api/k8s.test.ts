import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the Tauri API before importing the module under test
const mockInvoke = vi.fn();

vi.mock('@tauri-apps/api', () => ({
  invoke: mockInvoke
}));

// Mock the window object for Tauri
Object.defineProperty(global, 'window', {
  value: {
    __TAURI_INTERNALS__: {
      invoke: mockInvoke
    }
  },
  writable: true
});

// Import after mocking
import { k8sAPI } from './k8s';

describe('Kubernetes API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the singleton instance state
    (k8sAPI as any).isInitialized = false;
  });

  it('should initialize successfully', async () => {
    mockInvoke.mockResolvedValue(true);

    const result = await k8sAPI.init();
    expect(result).toBe(true);
    expect(mockInvoke).toHaveBeenCalledWith('init_k8s', {}, undefined);
  });

  it('should handle initialization errors', async () => {
    mockInvoke.mockRejectedValue(new Error('Connection failed'));

    const result = await k8sAPI.init();
    expect(result).toBe(false);
    expect(mockInvoke).toHaveBeenCalledWith('init_k8s', {}, undefined);
  });

  it('should get namespaces', async () => {
    const mockNamespaces = [
      { name: 'default', status: 'Active', age: '1d' },
      { name: 'kube-system', status: 'Active', age: '1d' }
    ];
    mockInvoke.mockResolvedValue(mockNamespaces);

    const namespaces = await k8sAPI.getNamespaces();
    expect(namespaces).toEqual(mockNamespaces);
    expect(mockInvoke).toHaveBeenCalledWith('k8s_get_namespaces', {}, undefined);
  });
});
