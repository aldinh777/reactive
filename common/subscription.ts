/**
 * @module
 * Shared module for types and functions related to subscription
 */

/**
 * Insert listener into set and return a callback that remove the item from array.
 */
export function subscribe<L>(set: Set<L>, listener: L): () => void {
    set.add(listener);
    return () => set.delete(listener);
}
