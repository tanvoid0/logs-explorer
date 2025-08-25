import type { K8sLog } from '$lib/types/k8s';
import type { FilterCondition, FilterGroup } from '$lib/components/AdvancedFilter.svelte';

// Parse structured log if it's JSON
function parseStructuredLog(log: K8sLog) {
  try {
    const parsed = JSON.parse(log.message);
    return {
      isStructured: true,
      data: parsed,
      rawMessage: log.message
    };
  } catch {
    return {
      isStructured: false,
      data: null,
      rawMessage: log.message
    };
  }
}

// Extract field value from log
function getFieldValue(log: K8sLog, fieldName: string): any {
  const parsedLog = parseStructuredLog(log);
  
  // Direct log fields
  const directFields: Record<string, any> = {
    message: log.message,
    level: log.level,
    namespace: log.namespace,
    pod: log.pod,
    container: log.container,
    timestamp: log.timestamp
  };
  
  if (directFields[fieldName] !== undefined) {
    return directFields[fieldName];
  }
  
  // Structured log fields
  if (parsedLog.isStructured && parsedLog.data) {
    const data = parsedLog.data;
    const structuredFields: Record<string, any> = {
      severity: data.severity || data.level || data.logLevel,
      time: data.time || data.timestamp || data.ts,
      logger: data.logger || data.component || data.service,
      requestId: data.requestId || data.request_id || data.trace_id,
      traceId: data['logging.googleapis.com/trace'] || data.requestId || data.request_id || data.trace_id,
      userId: data.userId || data.user_id || data.user,
      error: data.error || data.err || data.exception,
      stackTrace: data.stackTrace || data.stack_trace || data.stack,
      method: data.method || data.httpMethod,
      url: data.url || data.path || data.endpoint,
      statusCode: data.statusCode || data.status_code || data.status,
      duration: data.duration || data.elapsed || data.responseTime
    };
    
    if (structuredFields[fieldName] !== undefined) {
      return structuredFields[fieldName];
    }
  }
  
  return null;
}

// Apply a single condition to a log
function applyCondition(log: K8sLog, condition: FilterCondition): boolean {
  if (!condition.enabled) return true;
  
  const fieldValue = getFieldValue(log, condition.field);
  const conditionValue = condition.value;
  
  // Handle null/empty checks
  if (condition.operator === 'is_null') {
    return fieldValue === null || fieldValue === undefined || fieldValue === '';
  }
  
  if (condition.operator === 'is_not_null') {
    return fieldValue !== null && fieldValue !== undefined && fieldValue !== '';
  }
  
  // If field is null and we're not checking for null, return false
  if (fieldValue === null || fieldValue === undefined) {
    return false;
  }
  
  const fieldStr = String(fieldValue).toLowerCase();
  const conditionStr = conditionValue.toLowerCase();
  
  switch (condition.operator) {
    case 'equals':
      return fieldStr === conditionStr;
      
    case 'not_equals':
      return fieldStr !== conditionStr;
      
    case 'contains':
      return fieldStr.includes(conditionStr);
      
    case 'not_contains':
      return !fieldStr.includes(conditionStr);
      
    case 'starts_with':
      return fieldStr.startsWith(conditionStr);
      
    case 'ends_with':
      return fieldStr.endsWith(conditionStr);
      
    case 'regex':
      try {
        const regex = new RegExp(conditionValue, 'i');
        return regex.test(fieldStr);
      } catch {
        return false; // Invalid regex
      }
      
    case 'not_regex':
      try {
        const regex = new RegExp(conditionValue, 'i');
        return !regex.test(fieldStr);
      } catch {
        return true; // Invalid regex, so it doesn't match
      }
      
    case 'greater_than':
      return Number(fieldValue) > Number(conditionValue);
      
    case 'less_than':
      return Number(fieldValue) < Number(conditionValue);
      
    case 'greater_than_equal':
      return Number(fieldValue) >= Number(conditionValue);
      
    case 'less_than_equal':
      return Number(fieldValue) <= Number(conditionValue);
      
    case 'in':
      const values = conditionValue.split(',').map(v => v.trim().toLowerCase());
      return values.includes(fieldStr);
      
    case 'not_in':
      const notValues = conditionValue.split(',').map(v => v.trim().toLowerCase());
      return !notValues.includes(fieldStr);
      
    default:
      return true;
  }
}

// Apply a filter group to a log
function applyFilterGroup(log: K8sLog, group: FilterGroup): boolean {
  if (!group.enabled) return true;
  
  if (group.operator === 'AND') {
    return group.conditions.every(condition => applyCondition(log, condition));
  } else {
    return group.conditions.some(condition => applyCondition(log, condition));
  }
}

// Apply all filter groups to logs
export function applyFilters(logs: K8sLog[], filterGroups: FilterGroup[]): K8sLog[] {
  if (!filterGroups || filterGroups.length === 0) {
    return logs;
  }
  
  return logs.filter(log => {
    // All groups must pass (AND between groups)
    return filterGroups.every(group => applyFilterGroup(log, group));
  });
}

// Create a search query from filter groups (for backend compatibility)
export function createSearchQuery(filterGroups: FilterGroup[]): string {
  if (!filterGroups || filterGroups.length === 0) {
    return '';
  }
  
  const queries: string[] = [];
  
  for (const group of filterGroups) {
    if (!group.enabled) continue;
    
    const groupQueries: string[] = [];
    
    for (const condition of group.conditions) {
      if (!condition.enabled) continue;
      
      let query = '';
      
      switch (condition.operator) {
        case 'equals':
          query = `${condition.field}="${condition.value}"`;
          break;
        case 'not_equals':
          query = `NOT ${condition.field}="${condition.value}"`;
          break;
        case 'contains':
          query = `${condition.field}:${condition.value}`;
          break;
        case 'not_contains':
          query = `NOT ${condition.field}:${condition.value}`;
          break;
        case 'starts_with':
          query = `${condition.field}:${condition.value}*`;
          break;
        case 'ends_with':
          query = `${condition.field}:*${condition.value}`;
          break;
        case 'regex':
          query = `${condition.field}~"${condition.value}"`;
          break;
        case 'greater_than':
          query = `${condition.field}>${condition.value}`;
          break;
        case 'less_than':
          query = `${condition.field}<${condition.value}`;
          break;
        case 'greater_than_equal':
          query = `${condition.field}>=${condition.value}`;
          break;
        case 'less_than_equal':
          query = `${condition.field}<=${condition.value}`;
          break;
        case 'in':
          query = `${condition.field} IN (${condition.value})`;
          break;
        case 'not_in':
          query = `${condition.field} NOT IN (${condition.value})`;
          break;
        case 'is_null':
          query = `${condition.field} IS NULL`;
          break;
        case 'is_not_null':
          query = `${condition.field} IS NOT NULL`;
          break;
      }
      
      if (query) {
        groupQueries.push(query);
      }
    }
    
    if (groupQueries.length > 0) {
      const groupQuery = group.operator === 'AND' 
        ? groupQueries.join(' AND ')
        : groupQueries.join(' OR ');
      queries.push(`(${groupQuery})`);
    }
  }
  
  return queries.join(' AND ');
}

// Validate filter conditions
export function validateFilters(filterGroups: FilterGroup[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  for (const group of filterGroups) {
    for (const condition of group.conditions) {
      if (!condition.enabled) continue;
      
      // Check if regex is valid
      if (condition.operator === 'regex' || condition.operator === 'not_regex') {
        try {
          new RegExp(condition.value);
        } catch {
          errors.push(`Invalid regex in condition: ${condition.field} ${condition.operator} "${condition.value}"`);
        }
      }
      
      // Check if numeric operators have numeric values
      if (['greater_than', 'less_than', 'greater_than_equal', 'less_than_equal'].includes(condition.operator)) {
        if (isNaN(Number(condition.value))) {
          errors.push(`Non-numeric value for numeric operator: ${condition.field} ${condition.operator} "${condition.value}"`);
        }
      }
      
      // Check if datetime operators have valid datetime values
      if (condition.field === 'timestamp' && ['greater_than', 'less_than', 'greater_than_equal', 'less_than_equal'].includes(condition.operator)) {
        if (isNaN(Date.parse(condition.value))) {
          errors.push(`Invalid datetime value: ${condition.field} ${condition.operator} "${condition.value}"`);
        }
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
