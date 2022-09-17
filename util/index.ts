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
 * remove item from an array if item exists in that array
 *
 * @param elem item to remove from array
 * @param array array that stored said item
 */
function removeFromArray<T>(elem: T, array: T[]): void {
    const index = array.indexOf(elem);
    if (index !== -1) {
        array.splice(index, 1);
    }
}

/**
 * push item to an array if item not exists in that array
 *
 * @param elem item to push to array
 * @param array array to be pushed
 */
function pushNonExists<T>(elem: T, array: T[]): void {
    if (!array.includes(elem)) {
        array.push(elem);
    }
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
    pushNonExists(listener, array);
    return {
        target: target,
        listener: listener,
        unsub() {
            removeFromArray(listener, array);
        },
        resub() {
            pushNonExists(listener, array);
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
