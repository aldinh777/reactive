/**
 * a function that is returned from another function that supposed to do some unsubscribtion shennanigan
 */
export type Unsubscribe = () => void;

/**
 * whatever implement this, then it can be stopped
 */
export interface Stoppable {
    /**
     * the stop method to stop the stoppable
     */
    stop: Unsubscribe;
}

/**
 * insert listener into set and return a callback that remove the item from array
 */
export function subscribe<L>(set: Set<L>, listener: L): Unsubscribe {
    set.add(listener);
    return () => set.delete(listener);
}
