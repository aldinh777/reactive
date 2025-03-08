/**
 * @module
 * Shared module for types and function related to watchability
 */

export type UpdateHandler<T> = (index: number, value: T, prev: T) => any;
export type InsertHandler<T> = (index: number, value: T, last: boolean) => any;
export type DeleteHandler<T> = (index: number, value: T) => any;
export type OperationHandler<T> = (index: number, value: T, prev?: T | boolean) => any;

export interface BulkWatcher<T> {
    insert?: InsertHandler<T>;
    delete?: DeleteHandler<T>;
    update?: UpdateHandler<T>;
}

type Operation = '+' | '-' | '=';

function subscribe<L>(set: Set<L>) {
    return (listener: L) => {
        set.add(listener);
        return () => set.delete(listener);
    };
}

type Trigger<T> = (op: Operation, index: number, value: T, prev?: T | boolean) => void;

/**
 * Converts an object into Watchable and return a trigger function to trigger the updates.
 */
export function watchify<T>(list: any, unique: boolean = true): Trigger<T> {
    const listeners = {
        '=': new Set<OperationHandler<T>>(),
        '+': new Set<OperationHandler<T>>(),
        '-': new Set<OperationHandler<T>>()
    };
    const trigger = (op: Operation, key: number, value: T, updated?: T | boolean) => {
        const handlers = listeners[op];
        for (const handle of handlers || []) {
            // skip trigger if the updated value are the same with current value,
            // unless unique flag are set to false
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
