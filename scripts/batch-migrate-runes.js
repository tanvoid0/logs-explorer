#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple components that can be auto-migrated
const simpleComponents = [
  'src/lib/components/LogsViewerContent.svelte',
  'src/lib/components/ConfigTreeEditor.svelte',
  'src/lib/components/CentralizedTerminal.svelte',
  'src/lib/components/SDKManager.svelte',
  'src/lib/components/PipelineExecutor.svelte',
  'src/lib/components/LogsSearchPanel.svelte',
  'src/lib/components/ui/settings/SettingsForm.svelte',
  'src/lib/components/ui/settings/SettingsModal.svelte',
  'src/lib/components/ui/modal/ConfirmationModal.svelte',
  'src/lib/components/ui/modal/ModalManager.svelte',
  'src/lib/components/ui/table/TableFilters.svelte',
  'src/lib/components/ui/form-enhanced/FormBuilder.svelte',
  'src/lib/components/ui/table/DataTable.svelte',
  'src/lib/components/ui/action/ActionButton.svelte',
  'src/lib/components/ui/search/SearchExamples.svelte',
  'src/lib/components/ui/selector/BaseSelector.svelte',
  'src/lib/components/navigation/SidebarNavigation.svelte',
  'src/lib/components/navigation/SidebarNamespaceSelector.svelte',
  'src/lib/components/NamespaceSelector.svelte',
  'src/lib/components/workloads/NamespaceSelector.svelte',
  'src/lib/components/workloads/WorkloadStatus.svelte',
  'src/lib/components/workloads/WorkloadGrid.svelte',
  'src/lib/components/workloads/WorkloadCard.svelte',
  'src/lib/components/workloads/TimeFilter.svelte',
  'src/lib/components/workloads/PodsFilters.svelte',
  'src/lib/components/workloads/LogsSearchPanel.svelte',
  'src/lib/components/workloads/LogsFiltersPanel.svelte',
  'src/lib/components/workloads/LogsViewer.svelte',
  'src/lib/components/workloads/LogEntryCompact.svelte',
  'src/lib/components/workloads/LogEntryHeader.svelte',
  'src/lib/components/workloads/FrameworkSelector.svelte',
  'src/lib/components/workloads/DeploymentSelector.svelte',
  'src/lib/components/workloads/ConfigTreeEditor.svelte',
  'src/lib/components/workloads/ConfigDataViewer.svelte',
  'src/lib/components/workloads/AdvancedFilter.svelte',
  'src/lib/components/workloads/SeveritySelector.svelte',
  'src/lib/components/workloads/ServiceSelector.svelte',
  'src/lib/components/workloads/ProjectDeploymentSelector.svelte',
  'src/lib/components/workloads/PodSelector.svelte',
  'src/lib/components/workloads/LogsViewerContent.svelte',
  'src/lib/components/workloads/LogEntry.svelte',
  'src/lib/components/workloads/LogsDisplay.svelte',
  'src/lib/components/tasks/TaskProgressOverview.svelte',
  'src/lib/components/tasks/TaskGroup.svelte',
  'src/lib/components/tasks/TaskActions.svelte',
  'src/lib/components/tasks/ProjectTaskManager.svelte',
  'src/lib/components/tasks/TaskGroupModal.svelte',
  'src/lib/components/sdk/SDKOverview.svelte',
  'src/lib/components/sdk/SDKOperationsList.svelte',
  'src/lib/components/sdk/SDKManagersList.svelte',
  'src/lib/components/sdk/SDKInstallModal.svelte',
  'src/lib/components/sdk/SDKHeader.svelte',
  'src/lib/components/sdk/SDKSList.svelte',
  'src/lib/components/sdk/SDKManager.svelte',
  'src/lib/components/projects/ProjectTimestampsCard.svelte',
  'src/lib/components/projects/ProjectQuickActionsCard.svelte',
  'src/lib/components/projects/ProjectOverviewCard.svelte',
  'src/lib/components/projects/ProjectInformationCard.svelte',
  'src/lib/components/projects/ProjectCard.svelte',
  'src/lib/components/logs/LogsViewer.svelte',
  'src/lib/components/logs/LogsContent.svelte',
  'src/lib/components/logs/LogEntryCompact.svelte',
  'src/lib/components/logs/LogEntryHeader.svelte',
  'src/lib/components/logs/LogEntry.svelte',
  'src/lib/components/logs/LogsFiltersPanel.svelte',
  'src/lib/components/frameworks/FrameworkModal.svelte',
  'src/lib/components/frameworks/FrameworkFilters.svelte',
  'src/lib/components/frameworks/FrameworkCard.svelte',
  'src/lib/components/clusters/ClusterStatus.svelte',
  'src/lib/components/clusters/ClusterMetrics.svelte',
  'src/lib/components/clusters/ClusterManagement.svelte',
  'src/lib/components/clusters/ClusterHealth.svelte',
  'src/lib/components/overview/OverviewMetrics.svelte',
  'src/lib/components/overview/OverviewConnectionStatus.svelte',
  'src/lib/components/overview/OverviewActivity.svelte',
  'src/lib/components/terminal/TerminalManager.svelte',
  'src/lib/components/terminal/Terminal.svelte',
  'src/lib/components/terminal/SimpleTerminal.svelte',
  'src/lib/components/terminal/NonBlockingTerminal.svelte',
  'src/lib/components/terminal/CentralizedTerminal.svelte',
  'src/lib/components/pipeline/PipelineExecutor.svelte',
  'src/lib/components/pipeline/PipelineEditor.svelte',
  'src/lib/components/navigation/TopNavbar.svelte',
  'src/lib/components/navigation/PageTitle.svelte',
  'src/lib/components/LogEntry.svelte',
  'src/lib/components/LogsViewer.svelte',
  'src/lib/components/LogsSearchPanel.svelte',
  'src/lib/components/LogsDisplay.svelte',
  'src/lib/components/ConfigTreeEditor.svelte',
  'src/lib/components/ConfigDataViewer.svelte',
  'src/lib/components/CentralizedTerminal.svelte',
  'src/lib/components/toast/Toast.svelte'
];

function migrateComponent(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if already migrated
    if (content.includes('$props<')) {
      console.log(`✅ Already migrated: ${filePath}`);
      return;
    }
    
    // Simple migration patterns
    let migratedContent = content;
    
    // Replace export let with $props
    const exportLetRegex = /export\s+let\s+(\w+)(?:\s*:\s*([^=]+))?\s*=\s*([^;]+);/g;
    let match;
    const props = [];
    const defaultValues = [];
    
    while ((match = exportLetRegex.exec(content)) !== null) {
      const [, propName, type, defaultValue] = match;
      props.push(`${propName}?: ${type || 'any'}`);
      defaultValues.push(`${propName} = ${defaultValue}`);
    }
    
    if (props.length > 0) {
      const propsString = `const { ${defaultValues.join(', ')} } = $props<{${props.join('; ')} }>();`;
      migratedContent = content.replace(/export\s+let[^;]+;/g, propsString);
    }
    
    // Replace $: with $derived (simple cases)
    migratedContent = migratedContent.replace(/\$:\s*(\w+)\s*=\s*([^;]+);/g, 'const $1 = $derived($2);');
    
    // Replace $: if statements with $effect
    migratedContent = migratedContent.replace(/\$:\s*if\s*\(([^)]+)\)\s*\{/g, '$effect(() => { if ($1) {');
    
    // Write the migrated content
    fs.writeFileSync(filePath, migratedContent);
    console.log(`✅ Migrated: ${filePath}`);
    
  } catch (error) {
    console.error(`❌ Error migrating ${filePath}:`, error.message);
  }
}

console.log('Starting batch migration to runes mode...\n');

let migratedCount = 0;
let errorCount = 0;

simpleComponents.forEach(component => {
  if (fs.existsSync(component)) {
    migrateComponent(component);
    migratedCount++;
  } else {
    console.log(`⚠️  File not found: ${component}`);
    errorCount++;
  }
});

console.log(`\nMigration complete!`);
console.log(`✅ Successfully migrated: ${migratedCount} components`);
console.log(`❌ Errors: ${errorCount} components`);
console.log(`\nNote: Some components may need manual review for complex patterns.`);
