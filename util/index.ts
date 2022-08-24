export interface Subscription<S, T> {
    target: S;
    listener: T;
    unsub(): any;
    resub(): any;
}

export function removeFromArray<T>(elem: T, array: T[]): void {
    const index = array.indexOf(elem);
    if (index !== -1) {
        array.splice(index, 1);
    }
}

export function pushNonExists<T>(elem: T, array: T[]): void {
    if (!array.includes(elem)) {
        array.push(elem);
    }
}

export function createSubscription<S, T>(target: S, listener: T, array: T[]): Subscription<S, T> {
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
