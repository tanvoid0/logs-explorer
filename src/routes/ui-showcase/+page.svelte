<script lang="ts">
  import { logger } from '$lib/utils/logger';
  import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card/index.js';
  import { Button } from '$lib/components/ui/index.js';
  import { Badge, Alert } from '$lib/components/ui/feedback/index.js';
  import { Container, Separator } from '$lib/components/ui/layout/index.js';
  import { SearchInput, SearchExamples } from '$lib/components/ui/search/index.js';
  import { BaseSelector } from '$lib/components/ui/selector/index.js';
  import { StatusIndicator, ProgressBar } from '$lib/components/ui/status/index.js';
  import { ActionButton, ActionGroup } from '$lib/components/ui/action/index.js';
  import { EmptyState, LoadingState } from '$lib/components/ui/display/index.js';
  import type { K8sLog } from '$lib/types/k8s';

  // Sample data for demonstration
  const sampleLogs: K8sLog[] = [
    {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message: 'Application started successfully',
      pod: 'app-pod-123',
      container: 'app'
    },
    {
      timestamp: new Date(Date.now() - 1000).toISOString(),
      level: 'ERROR',
      message: 'Database connection failed',
      pod: 'app-pod-123',
      container: 'app'
    },
    {
      timestamp: new Date(Date.now() - 2000).toISOString(),
      level: 'WARN',
      message: 'High memory usage detected',
      pod: 'app-pod-456',
      container: 'app'
    }
  ];

  const severities = ['INFO', 'WARN', 'ERROR', 'DEBUG'];
  const pods = ['app-pod-123', 'app-pod-456', 'db-pod-789'];
  const namespaces = ['default', 'production', 'staging'];

  // Search examples
  const searchExamples = [
    {
      title: "Simple Text Search",
      query: "error",
      description: "Find logs containing 'error'",
      category: "Basic"
    },
    {
      title: "Field-Specific Search",
      query: "pod:my-app",
      description: "Find logs from pods containing 'my-app'",
      category: "Advanced"
    },
    {
      title: "Exact Match",
      query: "level:=ERROR",
      description: "Find logs with exact level 'ERROR'",
      category: "Advanced"
    }
  ];

  // State for interactive examples
  let searchValue = $state("");
  let selectedSeverity = $state("");
  let selectedPods = $state<string[]>([]);
  let isLoading = $state(false);
  let showEmptyState = $state(false);

  function handleSearch(query: string) {
    searchValue = query;
    logger.info('Searching in UI showcase', { searchValue });
  }

  function handleSeverityChange(event: CustomEvent) {
    selectedSeverity = event.detail.values[0] || "";
  }

  function handlePodsChange(event: CustomEvent) {
    selectedPods = event.detail.values;
  }

  function toggleLoading() {
    isLoading = !isLoading;
  }

  function toggleEmptyState() {
    showEmptyState = !showEmptyState;
  }
</script>

<svelte:head>
  <title>UI Component Showcase</title>
</svelte:head>

<Container maxWidth="2xl" className="py-8 space-y-8">
  <div class="text-center">
    <h1 class="text-3xl font-bold mb-2">UI Component Showcase</h1>
    <p class="text-slate-600 dark:text-slate-400">
      Demonstrating the new modular and reusable UI component system
    </p>
  </div>

  <!-- Search Components -->
  <Card>
    <CardHeader>
      <CardTitle>Search Components</CardTitle>
      <CardDescription>
        Reusable search components for consistent search functionality
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div>
        <h4 class="text-sm font-medium mb-2">Search Input</h4>
        <SearchInput 
          placeholder="Search logs..."
          value={searchValue}
          loading={isLoading}
          onSearch={handleSearch}
        />
      </div>
      
      <div>
        <h4 class="text-sm font-medium mb-2">Search Examples</h4>
        <SearchExamples 
          examples={searchExamples}
          on:useExample={(e) => searchValue = e.detail.query}
        />
      </div>
    </CardContent>
  </Card>

  <!-- Selector Components -->
  <Card>
    <CardHeader>
      <CardTitle>Selector Components</CardTitle>
      <CardDescription>
        Consistent selector components for dropdowns and multi-select
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 class="text-sm font-medium mb-2">Single Select</h4>
          <BaseSelector
            label="Severity"
            placeholder="Select severity..."
            options={severities.map(s => ({ value: s, label: s }))}
            selectedValues={selectedSeverity ? [selectedSeverity] : []}
            onchange={handleSeverityChange}
          />
        </div>
        
        <div>
          <h4 class="text-sm font-medium mb-2">Multi Select</h4>
          <BaseSelector
            label="Pods"
            placeholder="Select pods..."
            options={pods.map(p => ({ value: p, label: p }))}
            selectedValues={selectedPods}
            onchange={handlePodsChange}
          />
        </div>
      </div>
    </CardContent>
  </Card>

  <!-- Status Components -->
  <Card>
    <CardHeader>
      <CardTitle>Status Components</CardTitle>
      <CardDescription>
        Status indicators and progress bars
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div>
        <h4 class="text-sm font-medium mb-2">Status Indicators</h4>
        <div class="flex flex-wrap gap-2">
          <StatusIndicator status="online" />
          <StatusIndicator status="offline" />
          <StatusIndicator status="loading" />
          <StatusIndicator status="error" />
          <StatusIndicator status="warning" />
          <StatusIndicator status="success" />
        </div>
      </div>
      
      <div>
        <h4 class="text-sm font-medium mb-2">Progress Bars</h4>
        <div class="space-y-2">
          <ProgressBar value={75} max={100} label="Upload Progress" />
          <ProgressBar value={30} max={100} variant="warning" />
          <ProgressBar value={90} max={100} variant="success" />
        </div>
      </div>
    </CardContent>
  </Card>

  <!-- Action Components -->
  <Card>
    <CardHeader>
      <CardTitle>Action Components</CardTitle>
      <CardDescription>
        Pre-configured action buttons and action groups
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div>
        <h4 class="text-sm font-medium mb-2">Action Buttons</h4>
        <div class="flex flex-wrap gap-2">
          <ActionButton action="add" />
          <ActionButton action="edit" />
          <ActionButton action="delete" />
          <ActionButton action="save" />
          <ActionButton action="refresh" />
        </div>
      </div>
      
      <div>
        <h4 class="text-sm font-medium mb-2">Action Groups</h4>
        <ActionGroup 
          actions={[
            { action: 'add', label: 'New Item' },
            { action: 'refresh' },
            { action: 'export' }
          ]}
          showSeparators={true}
        />
      </div>
    </CardContent>
  </Card>

  <!-- Display Components -->
  <Card>
    <CardHeader>
      <CardTitle>Display Components</CardTitle>
      <CardDescription>
        Common display states for consistent user experience
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 class="text-sm font-medium mb-2">Loading State</h4>
          <LoadingState message="Loading data..." />
        </div>
        
        <div>
          <h4 class="text-sm font-medium mb-2">Empty State</h4>
          <EmptyState 
            title="No logs found"
            description="Try adjusting your search criteria or filters."
            icon="📋"
            showAction={true}
            actionLabel="Clear Filters"
          />
        </div>
      </div>
    </CardContent>
  </Card>

  <!-- Interactive Demo -->
  <Card>
    <CardHeader>
      <CardTitle>Interactive Demo</CardTitle>
      <CardDescription>
        Test the components interactively
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div class="flex gap-2">
        <Button onclick={toggleLoading}>
          {isLoading ? 'Stop Loading' : 'Start Loading'}
        </Button>
        <Button onclick={toggleEmptyState}>
          {showEmptyState ? 'Show Content' : 'Show Empty State'}
        </Button>
      </div>
      
      {#if showEmptyState}
        <EmptyState 
          title="Demo Empty State"
          description="This is a demonstration of the empty state component."
          icon="🎭"
        />
      {:else}
        <div class="space-y-4">
          <SearchInput 
            placeholder="Try searching..."
            onSearch={handleSearch}
          />
          <div class="text-sm text-slate-600 dark:text-slate-400">
            Search value: {searchValue || 'None'}
          </div>
        </div>
      {/if}
    </CardContent>
  </Card>

  <!-- Original Components (for comparison) -->
  <Card>
    <CardHeader>
      <CardTitle>Original Components</CardTitle>
      <CardDescription>
        Original components for comparison
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div class="flex space-x-2">
        <Badge variant="default">Default</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="destructive">Destructive</Badge>
        <Badge variant="outline">Outline</Badge>
        <Badge variant="default">Success</Badge>
        <Badge variant="secondary">Warning</Badge>
      </div>
      
      <div class="flex flex-wrap gap-2">
        <Button variant="default">Default</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
      </div>
      
      <Alert variant="default">
        This is a default alert message.
      </Alert>
    </CardContent>
  </Card>
</Container>
