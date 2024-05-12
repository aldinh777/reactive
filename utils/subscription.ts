export type Unsubscribe = () => void;

export interface Stoppable {
    stop: Unsubscribe;
}

/**
 * insert listener into array and return a callback that remove the item from array
 */
export function subscribe<L>(set: Set<L>, listener: L): Unsubscribe {
    set.add(listener);
    return () => set.delete(listener);
}
