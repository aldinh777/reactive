/**
 * @module
 * Shared module for types and function related to watchability
 */

export type OperationHandler<T> = (index: number, value: T, prev?: T) => any;
export type OperationUpdateHandler<T> = (index: number, value: T, prev: T) => any;
export interface BulkWatcher<T> {
    update?: OperationUpdateHandler<T>;
    insert?: OperationHandler<T>;
    delete?: OperationHandler<T>;
}

type Operation = '+' | '-' | '=';
type OperationListeners<T> = {
    [op in Operation]: Set<OperationHandler<T>>;
};

function subscribe<L>(set: Set<L>) {
    return (listener: L) => {
        set.add(listener);
        return () => set.delete(listener);
    };
}

/**
 * Converts an object into Watchable and return a trigger function to trigger the updates.
 */
export function watchify<T>(
    list: any,
    unique: boolean = true
): (op: Operation, index: number, value: T, prev?: T) => void {
    const listeners: OperationListeners<T> = { '+': new Set(), '-': new Set(), '=': new Set() };
    const trigger = (op: Operation, key: number, value: T, updated?: T) => {
        const handlers = listeners[op];
        for (const handle of handlers || []) {
            if (op !== '=' || !unique || value !== updated) {
                handle(key, value, updated);
            }
        }
    };
    list.onUpdate = subscribe(listeners['=']);
    list.onInsert = subscribe(listeners['+']);
    list.onDelete = subscribe(listeners['-']);
    list.watch = (operations: BulkWatcher<T>) => {
        const unsubUpdate = operations.update && list.onUpdate(operations.update);
        const unsubInsert = operations.insert && list.onInsert(operations.insert);
        const unsubDelete = operations.delete && list.onDelete(operations.delete);
        return () => {
            unsubUpdate?.();
            unsubInsert?.();
            unsubDelete?.();
        };
    };
    return trigger;
}
