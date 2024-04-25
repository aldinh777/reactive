import { pushNonExists, removeFromArray } from '@aldinh777/toolbox/array-operation.js';

export type Unsubscribe = () => void;

export interface Stoppable {
    stop: Unsubscribe;
}

/**
 * insert listener into array and return a callback that remove the item from array
 */
export function subscribe<L>(array: L[], listener: L): Unsubscribe {
    pushNonExists(array, listener);
    return () => removeFromArray(array, listener);
}
