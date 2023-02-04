import { pushNonExists, removeFromArray } from '@aldinh777/toolbox/array/operation';

/** Object That store subscriptions information */
export interface Subscription<S, T> {
    /** observed item */
    target: S;
    /** listener that listen when update happen */
    listener: T;
    /** disable listener to watch update */
    unsub(): any;
    /** reenable listener to watch update */
    resub(): any;
}

/**
 * create subscription object that control listener behaviour
 *
 * @param target item being observed
 * @param listener listener to be added to array
 * @param array array that stores listeners
 * @returns object literals that store subscription informations
 */
export function createSubscription<T, L>(target: T, listener: L, array: L[]): Subscription<T, L> {
    pushNonExists(array, listener);
    return {
        target: target,
        listener: listener,
        unsub() {
            removeFromArray(array, listener);
        },
        resub() {
            pushNonExists(array, listener);
        }
    };
}

/**
 * create subscription object that control another subscriptions behaviour
 *
 * @param target item or items being observed
 * @param listener callback when update happen
 * @param subscriptions subscriptions to be handled
 * @returns object literals that store subscription information
 */
export function createMultiSubscriptions<T, L, S extends Subscription<any, any>>(
    target: T,
    listener: L,
    subscriptions: S[]
): Subscription<T, L> {
    return {
        target: target,
        listener: listener,
        unsub() {
            for (const sub of subscriptions) {
                sub.unsub();
            }
        },
        resub() {
            for (const sub of subscriptions) {
                sub.resub();
            }
        }
    };
}
