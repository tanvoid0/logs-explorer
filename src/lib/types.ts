// TypeScript utility types
export type WithElementRef<T> = T & { element?: HTMLElement };
export type WithoutChildren<T> = Omit<T, 'children'>;
export type WithoutChild<T> = Omit<T, 'children'>;
export type WithoutChildrenOrChild<T> = Omit<T, 'children'>;
