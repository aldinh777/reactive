/**
 * @module
 * Shared module for types and functions related to subscription
 */

/**
 * A function that is returned from a function that is responsible for subscribing
 * to certain event, and is supposed to be used to unsubscribe from the event.
 */
export type Unsubscribe = () => void;

/**
 * Insert listener into set and return a callback that remove the item from array.
 */
export function subscribe<L>(set: Set<L>, listener: L): Unsubscribe {
    set.add(listener);
    return () => set.delete(listener);
}
