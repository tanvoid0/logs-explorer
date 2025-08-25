import { describe, it, expect, vi, beforeEach } from 'vitest';
import { k8sAPI } from './k8s';

// Mock the invoke function
vi.mock('@tauri-apps/api', () => ({
  invoke: vi.fn()
}));

describe('Kubernetes API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize successfully', async () => {
    const { invoke } = await import('@tauri-apps/api');
    vi.mocked(invoke).mockResolvedValue(true);

    const result = await k8sAPI.init();
    expect(result).toBe(true);
    expect(invoke).toHaveBeenCalledWith('init_k8s');
  });

  it('should handle initialization errors', async () => {
    const { invoke } = await import('@tauri-apps/api');
    vi.mocked(invoke).mockRejectedValue(new Error('Connection failed'));

    const result = await k8sAPI.init();
    expect(result).toBe(false);
  });

  it('should get namespaces', async () => {
    const { invoke } = await import('@tauri-apps/api');
    const mockNamespaces = [
      { name: 'default', status: 'Active', age: '1d' },
      { name: 'kube-system', status: 'Active', age: '1d' }
    ];
    vi.mocked(invoke).mockResolvedValue(mockNamespaces);

    const namespaces = await k8sAPI.getNamespaces();
    expect(namespaces).toEqual(mockNamespaces);
    expect(invoke).toHaveBeenCalledWith('k8s_get_namespaces');
  });
});
