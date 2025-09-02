// Custom type declarations for SvelteKit $app modules
// This is needed because the automatic generation isn't working properly

declare module '$app/navigation' {
  export function goto(url: string, options?: { replaceState?: boolean; noScroll?: boolean }): Promise<void>;
  export function invalidate(url: string): Promise<void>;
  export function invalidateAll(): Promise<void>;
  export function preload(url: string): Promise<void>;
  export function preloadData(url: string): Promise<void>;
  export function beforeNavigate(callback: (event: { cancel: () => void; from: URL; to: URL | null }) => void): () => void;
  export function afterNavigate(callback: (event: { from: URL; to: URL | null }) => void): () => void;
}

declare module '$app/stores' {
  import { Readable } from 'svelte/store';
  
  export const page: Readable<{
    url: URL;
    params: Record<string, string>;
    route: {
      id: string | null;
    };
    status: number;
    error: Error | null;
  }>;
  
  export const navigating: Readable<{
    from: URL | null;
    to: URL | null;
  } | null>;
  
  export const updated: Readable<boolean>;
}

declare module '$app/environment' {
  export const browser: boolean;
  export const dev: boolean;
  export const building: boolean;
  export const version: string;
}
