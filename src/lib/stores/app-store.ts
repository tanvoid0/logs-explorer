import { writable, derived } from 'svelte/store';
import { k8sAPI } from '../api/k8s';

// App State Interface
export interface AppState {
  // Connection state
  connection: {
    isConnected: boolean;
    isConnecting: boolean;
    currentContext: string | null;
    lastConnected: string | null;
    error: string | null;
    hasAttemptedConnection: boolean; // Track if we've tried to connect
  };
  
  // Namespace state
  namespace: {
    selected: string;
    available: string[];
    starred: string[];
    order: string[];
    isLoaded: boolean; // Track if namespaces have been loaded
  };
  
  // User preferences
  preferences: {
    autoConnect: boolean;
    defaultLogCount: number;
    refreshInterval: number;
    sortOrder: 'newest' | 'oldest';
  };
  
  // UI state
  ui: {
    isLoading: boolean;
    currentPage: string;
  };
}

// Default state
const defaultState: AppState = {
  connection: {
    isConnected: false,
    isConnecting: false,
    currentContext: null,
    lastConnected: null,
    error: null,
    hasAttemptedConnection: false
  },
  namespace: {
    selected: '',
    available: [],
    starred: [],
    order: [],
    isLoaded: false
  },
  preferences: {
    autoConnect: true,
    defaultLogCount: 100,
    refreshInterval: 30000,
    sortOrder: 'newest'
  },
  ui: {
    isLoading: false,
    currentPage: ''
  }
};

// Load from localStorage
function loadFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  
  try {
    const stored = localStorage.getItem(`logs-explorer-${key}`);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (error) {
    console.error(`Failed to load ${key} from localStorage:`, error);
    return defaultValue;
  }
}

// Save to localStorage
function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(`logs-explorer-${key}`, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to save ${key} to localStorage:`, error);
  }
}

// Create the main store
function createAppStore() {
  // Load initial state from localStorage
  const initialState: AppState = {
    ...defaultState,
    namespace: {
      selected: loadFromStorage('selected-namespace', ''),
      available: [],
      starred: loadFromStorage('starred-namespaces', []),
      order: loadFromStorage('namespace-order', []),
      isLoaded: false
    },
    preferences: {
      autoConnect: loadFromStorage('auto-connect', true),
      defaultLogCount: loadFromStorage('default-log-count', 100),
      refreshInterval: loadFromStorage('refresh-interval', 30000),
      sortOrder: loadFromStorage('sort-order', 'newest')
    }
  };

  const { subscribe, set, update } = writable<AppState>(initialState);

  return {
    subscribe,
    
    // Connection actions
    async connect() {
      update(state => ({
        ...state,
        connection: { 
          ...state.connection, 
          isConnecting: true, 
          error: null,
          hasAttemptedConnection: true
        }
      }));

      try {
        const success = await k8sAPI.init();
        if (success) {
          update(state => ({
            ...state,
            connection: {
              isConnected: true,
              isConnecting: false,
              currentContext: 'default',
              lastConnected: new Date().toISOString(),
              error: null,
              hasAttemptedConnection: true
            }
          }));
          
          // Load namespaces after successful connection
          await this.loadNamespaces();
          return true;
        } else {
          throw new Error('Failed to initialize Kubernetes client');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown connection error';
        update(state => ({
          ...state,
          connection: {
            ...state.connection,
            isConnected: false,
            isConnecting: false,
            error: errorMessage,
            hasAttemptedConnection: true
          }
        }));
        return false;
      }
    },

    async disconnect() {
      update(state => ({
        ...state,
        connection: {
          isConnected: false,
          isConnecting: false,
          currentContext: null,
          lastConnected: null,
          error: null,
          hasAttemptedConnection: true
        },
        namespace: {
          ...state.namespace,
          selected: '',
          available: [],
          isLoaded: false
        }
      }));
    },

    async healthCheck() {
      try {
        const isHealthy = await k8sAPI.healthCheck();
        if (!isHealthy) {
          update(state => ({
            ...state,
            connection: {
              ...state.connection,
              isConnected: false,
              error: 'Connection lost'
            }
          }));
        }
        return isHealthy;
      } catch (error) {
        update(state => ({
          ...state,
          connection: {
            ...state.connection,
            isConnected: false,
            error: 'Health check failed'
          }
        }));
        return false;
      }
    },

    // Namespace actions
    async loadNamespaces() {
      // Don't reload if already loaded and connected
      let currentState: AppState;
      subscribe(state => { currentState = state; })();
      if (currentState.namespace.isLoaded && currentState.connection.isConnected) {
        return;
      }

      update(state => ({ ...state, ui: { ...state.ui, isLoading: true } }));

      try {
        const namespaces = await k8sAPI.getNamespaces();
        const available = namespaces.map(ns => ns.name);
        
        update(state => ({
          ...state,
          namespace: { 
            ...state.namespace, 
            available,
            isLoaded: true
          },
          ui: { ...state.ui, isLoading: false }
        }));

        // Auto-select default namespace if none selected
        const updatedState = get({ subscribe });
        if (!updatedState.namespace.selected && available.length > 0) {
          const defaultNamespace = available.find(ns => ns === 'default') || available[0];
          this.setSelectedNamespace(defaultNamespace);
        }
      } catch (error) {
        console.error('Failed to load namespaces:', error);
        update(state => ({
          ...state,
          namespace: { 
            ...state.namespace, 
            available: [],
            isLoaded: false
          },
          ui: { ...state.ui, isLoading: false }
        }));
      }
    },

    // Lazy connection - only connect when explicitly requested
    async ensureConnected() {
      let currentState: AppState;
      subscribe(state => { currentState = state; })();
      
      // If already connected, return true
      if (currentState.connection.isConnected) {
        return true;
      }
      
      // If we haven't attempted connection and auto-connect is enabled, try to connect
      if (!currentState.connection.hasAttemptedConnection && currentState.preferences.autoConnect) {
        return await this.connect();
      }
      
      return false;
    },

    setSelectedNamespace(namespace: string) {
      update(state => ({
        ...state,
        namespace: { ...state.namespace, selected: namespace }
      }));
      saveToStorage('selected-namespace', namespace);
    },

    toggleStarredNamespace(namespace: string) {
      update(state => {
        const starred = state.namespace.starred.includes(namespace)
          ? state.namespace.starred.filter(ns => ns !== namespace)
          : [...state.namespace.starred, namespace];
        
        return {
          ...state,
          namespace: { ...state.namespace, starred }
        };
      });
      
      const currentState = get({ subscribe });
      saveToStorage('starred-namespaces', currentState.namespace.starred);
    },

    setNamespaceOrder(order: string[]) {
      update(state => ({
        ...state,
        namespace: { ...state.namespace, order }
      }));
      saveToStorage('namespace-order', order);
    },

    // Preference actions
    setAutoConnect(enabled: boolean) {
      update(state => ({
        ...state,
        preferences: { ...state.preferences, autoConnect: enabled }
      }));
      saveToStorage('auto-connect', enabled);
    },

    setDefaultLogCount(count: number) {
      update(state => ({
        ...state,
        preferences: { ...state.preferences, defaultLogCount: count }
      }));
      saveToStorage('default-log-count', count);
    },

    setRefreshInterval(interval: number) {
      update(state => ({
        ...state,
        preferences: { ...state.preferences, refreshInterval: interval }
      }));
      saveToStorage('refresh-interval', interval);
    },

    setSortOrder(order: 'newest' | 'oldest') {
      update(state => ({
        ...state,
        preferences: { ...state.preferences, sortOrder: order }
      }));
      saveToStorage('sort-order', order);
    },

    // UI actions
    setLoading(isLoading: boolean) {
      update(state => ({
        ...state,
        ui: { ...state.ui, isLoading }
      }));
    },

    setCurrentPage(page: string) {
      update(state => ({
        ...state,
        ui: { ...state.ui, currentPage: page }
      }));
    },

    // Utility actions
    clearAllData() {
      update(state => ({
        ...state,
        namespace: { 
          ...state.namespace, 
          selected: '', 
          available: [],
          isLoaded: false
        }
      }));
      
      // Clear localStorage
      localStorage.removeItem('logs-explorer-selected-namespace');
      localStorage.removeItem('logs-explorer-starred-namespaces');
      localStorage.removeItem('logs-explorer-namespace-order');
    }
  };
}

// Create and export the store
export const appStore = createAppStore();

// Derived stores for easier access
export const connectionState = derived(appStore, $appStore => $appStore.connection);
export const namespaceState = derived(appStore, $appStore => $appStore.namespace);
export const preferences = derived(appStore, $appStore => $appStore.preferences);
export const uiState = derived(appStore, $appStore => $appStore.ui);

// Helper function to get current state
function get<T>(store: { subscribe: (value: T) => void }): T {
  let value: T;
  store.subscribe(v => value = v)();
  return value!;
}
