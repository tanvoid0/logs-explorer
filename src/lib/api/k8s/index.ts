// Main Kubernetes API exports
export * from './client';
export * from './pods';
export * from './services';
export * from './deployments';
export * from './configmaps';
export * from './secrets';
export * from './jobs';
export * from './logs';
export * from './port-forwarding';
export * from './health';

// Export the main API instance
export { k8sAPI } from './client';
