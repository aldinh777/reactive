import { pushNonExists, removeFromArray } from '@aldinh777/toolbox/array-operation.js';

export type Unsubscribe = () => void;

/**
 * create subscription object that control listener behaviour
 *
 * @param target item being observed
 * @param listener listener to be added to array
 * @param array array that stores listeners
 * @returns object literals that store subscription informations
 */
export function subscribe<L>(listener: L, array: L[]): Unsubscribe {
    pushNonExists(array, listener);
    return () => removeFromArray(array, listener);
}
