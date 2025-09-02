// Navigation utility to replace SvelteKit navigation functions
// This provides a simple interface for navigation and page state

import { writable } from 'svelte/store';

// Simple navigation function
export function goto(path: string) {
  window.location.href = path;
}

// Simple page store that tracks current URL
export const page = writable({
  url: new URL(window.location.href),
  params: {
    get: (key: string) => new URLSearchParams(window.location.search).get(key),
    deployment: new URLSearchParams(window.location.search).get('deployment'),
    job: new URLSearchParams(window.location.search).get('job'),
    pod: new URLSearchParams(window.location.search).get('pod'),
    id: new URLSearchParams(window.location.search).get('id')
  },
  pathname: window.location.pathname
});

// Update page store when URL changes
if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    const searchParams = new URLSearchParams(window.location.search);
    page.set({
      url: new URL(window.location.href),
      params: {
        get: (key: string) => searchParams.get(key),
        deployment: searchParams.get('deployment'),
        job: searchParams.get('job'),
        pod: searchParams.get('pod'),
        id: searchParams.get('id')
      },
      pathname: window.location.pathname
    });
  });
}

// Helper function to get URL parameters
export function getUrlParam(name: string): string | null {
  return new URLSearchParams(window.location.search).get(name);
}

// Helper function to set URL parameters
export function setUrlParam(name: string, value: string) {
  const url = new URL(window.location.href);
  url.searchParams.set(name, value);
  window.history.pushState({}, '', url.toString());
  
  // Update page store
  page.set({
    url,
    params: {
      get: (key: string) => url.searchParams.get(key),
      deployment: url.searchParams.get('deployment'),
      job: url.searchParams.get('job'),
      pod: url.searchParams.get('pod'),
      id: url.searchParams.get('id')
    },
    pathname: url.pathname
  });
}
