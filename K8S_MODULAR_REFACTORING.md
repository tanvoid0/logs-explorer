# Kubernetes Modular Refactoring Guide

## Overview

This document outlines the modular refactoring of the Kubernetes functionality to improve maintainability, testability, and separation of concerns.

## Motivation

The original `k8s.ts` and `k8s.rs` files were becoming large and handling multiple responsibilities, making them difficult to maintain and modify without affecting other sections.

## New Structure

### Frontend (TypeScript)

```
src/lib/
├── types/k8s/
│   ├── index.ts                 # Main type exports
│   ├── pods.ts                  # Pod-related types
│   ├── services.ts              # Service-related types
│   ├── deployments.ts           # Deployment-related types
│   ├── configmaps.ts            # ConfigMap-related types
│   ├── secrets.ts               # Secret-related types
│   ├── jobs.ts                  # Job-related types
│   ├── logs.ts                  # Log-related types
│   ├── port-forwarding.ts       # Port forwarding types
│   └── search.ts                # Search/filtering types
├── api/k8s/
│   ├── index.ts                 # Main API exports
│   ├── client.ts                # Core client initialization
│   ├── pods.ts                  # Pod operations
│   ├── services.ts              # Service operations
│   ├── deployments.ts           # Deployment operations
│   ├── configmaps.ts            # ConfigMap operations
│   ├── secrets.ts               # Secret operations
│   ├── jobs.ts                  # Job operations
│   ├── logs.ts                  # Log operations
│   ├── port-forwarding.ts       # Port forwarding operations
│   └── health.ts                # Health checks
└── services/k8s/
    ├── index.ts                 # Service exports
    ├── k8s-client.service.ts    # Core client service
    ├── pod.service.ts           # Pod service
    ├── service.service.ts       # Service service
    ├── deployment.service.ts    # Deployment service
    ├── configmap.service.ts     # ConfigMap service
    ├── secret.service.ts        # Secret service
    ├── job.service.ts           # Job service
    ├── log.service.ts           # Log service
    └── port-forward.service.ts  # Port forward service
```

### Backend (Rust)

```
src-tauri/src/k8s/
├── mod.rs                      # Module declarations
├── types/
│   ├── mod.rs                  # Type module
│   ├── pods.rs                 # Pod types
│   ├── services.rs             # Service types
│   ├── deployments.rs          # Deployment types
│   ├── configmaps.rs           # ConfigMap types
│   ├── secrets.rs              # Secret types
│   ├── jobs.rs                 # Job types
│   ├── logs.rs                 # Log types
│   ├── port_forwarding.rs      # Port forwarding types
│   └── search.rs               # Search types
├── services/
│   ├── mod.rs                  # Service module
│   ├── client.rs               # Core client management
│   ├── pod_service.rs          # Pod operations
│   ├── service_service.rs      # Service operations
│   ├── deployment_service.rs   # Deployment operations
│   ├── configmap_service.rs    # ConfigMap operations
│   ├── secret_service.rs       # Secret operations
│   ├── job_service.rs          # Job operations
│   ├── log_service.rs          # Log operations
│   └── port_forward_service.rs # Port forwarding operations
├── commands/
│   ├── mod.rs                  # Command module
│   ├── pod_commands.rs         # Pod Tauri commands
│   ├── service_commands.rs     # Service Tauri commands
│   ├── deployment_commands.rs  # Deployment Tauri commands
│   ├── configmap_commands.rs   # ConfigMap Tauri commands
│   ├── secret_commands.rs      # Secret Tauri commands
│   ├── job_commands.rs         # Job Tauri commands
│   ├── log_commands.rs         # Log Tauri commands
│   └── port_forward_commands.rs # Port forward Tauri commands
└── utils/
    ├── mod.rs                  # Utils module
    ├── age_calculator.rs       # Age calculation utilities
    ├── port_validator.rs       # Port validation utilities
    └── search_parser.rs        # Search query parsing
```

## Migration Steps

### 1. Update Imports

Replace the old monolithic imports:

```typescript
// Old
import { k8sAPI } from '../api/k8s';
import type { K8sPod, K8sService } from '../types/k8s';

// New
import { k8sAPI, podAPI, serviceAPI } from '../api/k8s';
import type { K8sPod, K8sService } from '../types/k8s';
```

### 2. Use Specific APIs

Instead of using the main `k8sAPI` for everything, use specific APIs:

```typescript
// Old
const pods = await k8sAPI.getPods(namespace);

// New
const pods = await podAPI.getPods(namespace);
```

### 3. Update Component Imports

Components should import only what they need:

```typescript
// For pod-related components
import { podAPI } from '../api/k8s';
import type { K8sPod } from '../types/k8s';

// For service-related components
import { serviceAPI } from '../api/k8s';
import type { K8sService } from '../types/k8s';
```

## Benefits

### 1. **Separation of Concerns**
- Each module handles a specific Kubernetes resource type
- Clear boundaries between different operations
- Easier to understand and maintain

### 2. **Improved Testability**
- Each module can be tested independently
- Mock specific APIs without affecting others
- Better unit test coverage

### 3. **Enhanced Maintainability**
- Changes to one resource type don't affect others
- Easier to add new features or modify existing ones
- Better code organization

### 4. **Better Type Safety**
- Specific types for each resource
- Reduced chance of type mismatches
- Better IDE support and autocomplete

### 5. **Scalability**
- Easy to add new Kubernetes resources
- Modular structure supports team development
- Clear patterns for extending functionality

## Usage Examples

### Pod Operations

```typescript
import { podAPI } from '../api/k8s';
import type { K8sPod } from '../types/k8s';

// Get pods
const pods = await podAPI.getPods('default');

// Delete a pod
await podAPI.deletePod('default', 'my-pod');

// Restart a pod
await podAPI.restartPod('default', 'my-pod');
```

### Service Operations

```typescript
import { serviceAPI } from '../api/k8s';
import type { K8sService } from '../types/k8s';

// Get services
const services = await serviceAPI.getServices('default');
```

### Deployment Operations

```typescript
import { deploymentAPI } from '../api/k8s';
import type { K8sDeployment } from '../types/k8s';

// Get deployments
const deployments = await deploymentAPI.getDeployments('default');

// Scale deployment
await deploymentAPI.scaleDeployment('default', 'my-deployment', 3);
```

### Log Operations

```typescript
import { logAPI } from '../api/k8s';
import type { K8sLog } from '../types/k8s';

// Get logs from a pod
const logs = await logAPI.getLogs('default', 'my-pod');

// Get namespace logs with filtering
const namespaceLogs = await logAPI.getNamespaceLogs('default', {
  deployments: ['my-deployment'],
  tail: 100,
  search: 'error'
});
```

### Port Forwarding

```typescript
import { portForwardAPI } from '../api/k8s';
import type { PortForward } from '../types/k8s';

// Start port forwarding
const portForward = await portForwardAPI.startPortForward(
  'default',
  'my-pod',
  'pod',
  { localPort: 8080, remotePort: 80 }
);

// List active port forwards
const activeForwards = await portForwardAPI.listPortForwards();
```

## Backward Compatibility

The main `k8sAPI` instance still provides access to all functionality for backward compatibility:

```typescript
import { k8sAPI } from '../api/k8s';

// Still works
const pods = await k8sAPI.getPods(namespace);
const services = await k8sAPI.getServices(namespace);
```

However, it's recommended to migrate to the specific APIs for better maintainability.

## Testing

Each module can be tested independently:

```typescript
// Test pod API
import { podAPI } from '../api/k8s';

describe('PodAPI', () => {
  it('should get pods for a namespace', async () => {
    const pods = await podAPI.getPods('default');
    expect(pods).toBeDefined();
  });
});
```

## Future Enhancements

1. **Service Layer**: Add business logic layer between API and components
2. **Caching**: Implement caching for frequently accessed data
3. **Real-time Updates**: Enhance watch functionality with WebSocket support
4. **Error Handling**: Centralized error handling and retry logic
5. **Metrics**: Add performance metrics and monitoring

## Conclusion

This modular refactoring provides a solid foundation for scaling the Kubernetes functionality while maintaining code quality and developer productivity. The separation of concerns makes the codebase more maintainable and easier to extend with new features.
