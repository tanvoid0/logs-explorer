import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

// Re-export types from types.ts
export { 
  type WithElementRef, 
  type WithoutChildren, 
  type WithoutChild, 
  type WithoutChildrenOrChild 
} from './types';
