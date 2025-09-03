<script lang="ts">
  import { onMount } from 'svelte';
  import { getAllFrameworks, createFramework, deleteFramework, toggleFrameworkActive, searchFrameworks, type Framework } from '$lib/api/frameworks';
  import { getFrameworkCategories } from '$lib/api/frameworks';
  import { Container } from '$lib/components/ui/layout/index.js';
  import { LoadingState, EmptyState } from '$lib/components/ui/display/index.js';
  import { ActionButton } from '$lib/components/ui/action/index.js';
  import { Alert } from '$lib/components/ui/feedback/index.js';
  import { FrameworkCard, FrameworkFilters, FrameworkModal } from '$lib/components/frameworks/index.js';

  let frameworks = $state<Framework[]>([]);
  let categories = $state<string[]>([]);
  let loading = $state(true);
  let error = $state('');
  let searchQuery = $state('');
  let selectedCategory = $state('');
  let showModal = $state(false);
  let editingFramework = $state<Framework | null>(null);
  let modalLoading = $state(false);

  onMount(async () => {
    await loadData();
  });

  async function loadData() {
    try {
      loading = true;
      error = '';
      
      const [frameworksData, categoriesData] = await Promise.all([
        getAllFrameworks(),
        getFrameworkCategories()
      ]);
      
      frameworks = frameworksData;
      categories = categoriesData;
    } catch (err) {
      error = `Failed to load frameworks: ${err}`;
    } finally {
      loading = false;
    }
  }

  async function handleCreateFramework(values: Record<string, any>) {
    
    try {
      modalLoading = true;
      const framework = await createFramework(
        values.name,
        values.category,
        values.description || undefined,
        values.version || undefined,
        values.website || undefined,
        values.documentation_url || undefined
      );
      
      frameworks = [...frameworks, framework];
      showModal = false;
    } catch (err) {
      error = `Failed to create framework: ${err}`;
    } finally {
      modalLoading = false;
    }
  }

  async function handleUpdateFramework(values: Record<string, any>) {
    
    try {
      modalLoading = true;
      // Note: Update framework API call would go here
      // For now, we'll just close the modal
      showModal = false;
      editingFramework = null;
    } catch (err) {
      error = `Failed to update framework: ${err}`;
    } finally {
      modalLoading = false;
    }
  }

  async function handleDeleteFramework(id: number) {
    
    if (!confirm('Are you sure you want to delete this framework?')) return;
    
    try {
      const success = await deleteFramework(id);
      if (success) {
        frameworks = frameworks.filter(f => f.id !== id);
      }
    } catch (err) {
      error = `Failed to delete framework: ${err}`;
    }
  }

  async function handleToggleActive(id: number) {
    
    try {
      await toggleFrameworkActive(id);
      frameworks = frameworks.map(f => 
        f.id === id ? { ...f, is_active: !f.is_active } : f
      );
    } catch (err) {
      error = `Failed to toggle framework status: ${err}`;
    }
  }

  async function handleSearch() {
    if (!searchQuery.trim()) {
      await loadData();
      return;
    }
    
    try {
      frameworks = await searchFrameworks(searchQuery);
    } catch (err) {
      error = `Failed to search frameworks: ${err}`;
    }
  }

  function filterByCategory() {
    if (!selectedCategory) return frameworks;
    return frameworks.filter(f => f.category === selectedCategory);
  }

  function handleSearchChange(query: string) {
    searchQuery = query;
  }

  function handleCategoryChange(category: string) {
    selectedCategory = category;
  }

  function handleModalClose() {
    showModal = false;
    editingFramework = null;
  }

  function handleModalSave(values: Record<string, any>, isEditing: boolean) {
    if (isEditing) {
      handleUpdateFramework(values);
    } else {
      handleCreateFramework(values);
    }
  }

  function openAddModal() {
    editingFramework = null;
    showModal = true;
  }

  function openEditModal(framework: Framework) {
    editingFramework = framework;
    showModal = true;
  }

  let filteredFrameworks = $derived(filterByCategory());
</script>

<svelte:head>
  <title>Frameworks - Logs Explorer</title>
</svelte:head>

<Container maxWidth="2xl" className="py-8">
  <!-- Header -->
  <div class="flex justify-between items-center mb-6">
    <div>
      <h1 class="text-3xl font-bold text-slate-900 dark:text-white">Frameworks</h1>
      <p class="text-slate-600 dark:text-slate-400">Manage your development frameworks</p>
    </div>
    <ActionButton
      action="add"
      label="Add Framework"
      onclick={openAddModal}
    />
  </div>

  <!-- Error Display -->
  {#if error}
    <Alert
      variant="destructive"
      className="mb-6"
    >
      {error}
    </Alert>
  {/if}

  <!-- Search and Filter -->
  <FrameworkFilters
    {searchQuery}
    {selectedCategory}
    {categories}
    className="mb-6"
    onSearchChange={handleSearchChange}
    onCategoryChange={handleCategoryChange}
    onSearch={handleSearch}
    onRefresh={loadData}
  />

  <!-- Frameworks List -->
  {#if loading}
    <LoadingState message="Loading frameworks..." />
  {:else if filteredFrameworks.length === 0}
    <EmptyState
      title="No frameworks found"
      description="Get started by adding your first framework"
      actionLabel="Add Framework"
      showAction={true}
      onaction={openAddModal}
    />
  {:else}
    <div class="grid gap-4">
      {#each filteredFrameworks as framework}
        <FrameworkCard
          {framework}
          onToggleActive={handleToggleActive}
          onDelete={handleDeleteFramework}
          onEdit={openEditModal}
        />
      {/each}
    </div>
  {/if}
</Container>

<!-- Framework Modal -->
<FrameworkModal
  isOpen={showModal}
  editingFramework={editingFramework}
  {categories}
  loading={modalLoading}
  onClose={handleModalClose}
  onSave={handleModalSave}
/>
