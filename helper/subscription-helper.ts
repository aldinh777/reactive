import { pushNonExists, removeFromArray } from '@aldinh777/toolbox/array/operation';

/** Object That store subscriptions information */
export interface Subscription {
    /** disable listener to watch update */
    unsubscribe(): void;
    /** reenable listener to watch update */
    resubscribe(): void;
}

/**
 * create subscription object that control listener behaviour
 *
 * @param target item being observed
 * @param listener listener to be added to array
 * @param array array that stores listeners
 * @returns object literals that store subscription informations
 */
export function subscribe<L>(listener: L, array: L[]): Subscription {
    pushNonExists(array, listener);
    return {
        unsubscribe() {
            removeFromArray(array, listener);
        },
        resubscribe() {
            pushNonExists(array, listener);
        }
    };
}
