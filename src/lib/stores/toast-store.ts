import { writable } from 'svelte/store';

export interface ToastNotification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  timestamp: Date;
}

interface ToastState {
  notifications: ToastNotification[];
}

function createToastStore() {
  const { subscribe, set, update } = writable<ToastState>({
    notifications: []
  });

  let nextId = 1;

  function generateId(): string {
    return `toast-${nextId++}-${Date.now()}`;
  }

  return {
    subscribe,
    
    show(message: string, type: ToastNotification['type'] = 'info', duration: number = 5000) {
      const notification: ToastNotification = {
        id: generateId(),
        message,
        type,
        duration,
        timestamp: new Date()
      };

      update(state => ({
        ...state,
        notifications: [...state.notifications, notification]
      }));

      // Auto-remove after duration
      if (duration > 0) {
        setTimeout(() => {
          this.remove(notification.id);
        }, duration);
      }

      return notification.id;
    },

    success(message: string, duration?: number) {
      return this.show(message, 'success', duration);
    },

    error(message: string, duration?: number) {
      return this.show(message, 'error', duration);
    },

    warning(message: string, duration?: number) {
      return this.show(message, 'warning', duration);
    },

    info(message: string, duration?: number) {
      return this.show(message, 'info', duration);
    },

    remove(id: string) {
      update(state => ({
        ...state,
        notifications: state.notifications.filter(n => n.id !== id)
      }));
    },

    clear() {
      update(state => ({
        ...state,
        notifications: []
      }));
    },

    // Helper methods for common notifications
    connectionSuccess(context?: string) {
      const message = context 
        ? `Connected to Kubernetes cluster: ${context}`
        : 'Connected to Kubernetes successfully';
      return this.success(message);
    },

    connectionError(error: string) {
      return this.error(`Connection failed: ${error}`);
    },

    dataLoadSuccess(resource: string, count?: number) {
      const message = count 
        ? `Loaded ${count} ${resource} successfully`
        : `Loaded ${resource} successfully`;
      return this.success(message);
    },

    dataLoadError(resource: string, error: string) {
      return this.error(`Failed to load ${resource}: ${error}`);
    },

    operationSuccess(operation: string) {
      return this.success(`${operation} completed successfully`);
    },

    operationError(operation: string, error: string) {
      return this.error(`${operation} failed: ${error}`);
    }
  };
}

export const toastStore = createToastStore();
