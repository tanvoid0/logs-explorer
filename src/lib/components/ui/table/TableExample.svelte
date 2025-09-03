<script lang="ts">
import { logger } from '$lib/utils/logger';
import { EnhancedDataTable } from './index';

// Define the Filter type locally since it's not exported
interface Filter {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'number';
  options?: Array<{ value: string; label: string }>;
  value: string | number | null;
}

  // Sample data
  let data = $state([
    { id: 1, name: 'John Doe', email: 'john@example.com', status: 'Active', role: 'Admin' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'Inactive', role: 'User' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', status: 'Active', role: 'Editor' },
  ]);

  let searchQuery = $state("");
  let currentPage = $state(1);
  let pageSize = $state(10);
  let selectedItems = $state<any[]>([]);

  // Table configuration
  const columns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'role', label: 'Role', sortable: true },
  ];

  const filters = [
    {
      key: 'status',
      label: 'Status',
      type: 'select' as const,
      options: [
        { value: 'Active', label: 'Active' },
        { value: 'Inactive', label: 'Inactive' },
      ],
      value: null,
    },
    {
      key: 'role',
      label: 'Role',
      type: 'select' as const,
      options: [
        { value: 'Admin', label: 'Admin' },
        { value: 'User', label: 'User' },
        { value: 'Editor', label: 'Editor' },
      ],
      value: null,
    },
  ];

  const actions = [
    { key: 'add', label: 'Add User', action: 'add' as const },
    { key: 'edit', label: 'Edit', action: 'edit' as const, bulkOnly: true },
    { key: 'delete', label: 'Delete', action: 'delete' as const, variant: 'destructive' as const, bulkOnly: true },
    { key: 'export', label: 'Export', action: 'export' as const },
  ];

  // Event handlers
  function handleSearchChange(query: string) {
    searchQuery = query;
    // Implement search logic
  }

  function handleFilterChange(filters: Filter[]) {
    // Implement filter logic
  }

  function handlePageChange(page: number) {
    currentPage = page;
    // Implement pagination logic
  }

  function handleAction(action: string, items: any[]) {
    // Implement action logic
    logger.info({ action, items });
  }

  function handleSelectAll(selectedItems: any[]) {
    // Update selected items
  }
</script>

<div class="p-6">
  <h2 class="text-2xl font-bold mb-6">Enhanced Table Example</h2>
  
  <EnhancedDataTable
    {data}
    {columns}
    title="Users"
    {searchQuery}
    {filters}
    {currentPage}
    totalPages={1}
    totalItems={data.length}
    {pageSize}
    {selectedItems}
    {actions}
    onSearchChange={handleSearchChange}
    onFilterChange={handleFilterChange}
    onAction={handleAction}
    onSelectionChange={handleSelectAll}
  />
</div>
