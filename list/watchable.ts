/**
 * @module
 * Shared module for types and function related to watchability
 */

import type { Stoppable, Unsubscribe } from '../utils/subscription.ts';
import { subscribe } from '../utils/subscription.ts';

/**
 * Represents the operation type of a watchable list.
 */
export type Operation = '+' | '-' | '=';

/**
 * Represents the handler function for a watchable list operation.
 */
export type OperationHandler<K, V> = (key: K, value: V, prev: V) => any;

/**
 * Represents the map of operation listeners.
 */
export type OperationListeners<K, V> = {
    [op in Operation]: Set<OperationHandler<K, V>>;
};

/**
 * Represents the bulk watcher interface.
 */
export interface BulkWatcher<K, V> {
    /**
     * Registers a listener to be called whenever an update operation occurs.
     */
    update?: OperationHandler<K, V>;

    /**
     * Registers a listener to be called whenever an insert operation occurs.
     */
    insert?: OperationHandler<K, V>;

    /**
     * Registers a listener to be called whenever a delete operation occurs.
     */
    delete?: OperationHandler<K, V>;
}

/**
 * Represents a reactive list that is derived from another reactive list,
 * making it also be stoppable from observing the other reactive list
 */
export interface ObservedList<T> extends WatchableList<T>, Stoppable {}

/**
 * Represents a watchable object with operations to observe changes.
 */
export interface Watchable<K, V> {
    /**
     * Registers a listener to be called whenever an update operation occurs.
     */
    onUpdate(listener: OperationHandler<K, V>): Unsubscribe;

    /**
     * Registers a listener to be called whenever an insert operation occurs.
     */
    onInsert(listener: OperationHandler<K, V>): Unsubscribe;

    /**
     * Registers a listener to be called whenever a delete operation occurs.
     */
    onDelete(listener: OperationHandler<K, V>): Unsubscribe;

    /**
     * Registers necessary listeners to observe multiple types of operations.
     */
    watch(operations: BulkWatcher<K, V>): Unsubscribe;
}

/**
 * Represents a watchable list with operations to observe changes.
 */
export interface WatchableList<T> extends Watchable<number, T> {
    /**
     * Retrieves the current elements as array.
     */
    (): T[];

    /**
     * Retrieves the element at the specified index of the list.
     */
    (key: number): T;

    /**
     * Creates a new observed list that filters out the elements of the list based on the given function.
     */
    filter(fn: (item: T) => boolean): ObservedList<T>;

    /**
     * Creates a new observed list that maps the elements of the list based on the given function.
     */
    map<U>(fn: (item: T) => U): ObservedList<U>;

    /**
     * Creates a new observed list that sorts the elements of the list based on the given function.
     */
    sort(fn?: (item: T, elem: T) => boolean): ObservedList<T>;
}

/**
 * Converts an object into Watchable and return a trigger function to trigger the updates.
 */
export function watchify<K, V>(list: any, unique: boolean = true): (op: Operation, key: K, value: V, prev?: V) => void {
    const upd: OperationListeners<K, V> = { '+': new Set(), '-': new Set(), '=': new Set() };
    const trigger = (op: Operation, key: K, value: V, updated?: V) => {
        const handlers = upd[op];
        for (const handle of handlers || []) {
            handle(key, value, updated);
        }
    };
    list.onUpdate = (listener: OperationHandler<K, V>) =>
        subscribe(upd['='], (key, value, prev) => {
            if (!unique || prev !== value) {
                listener(key, value, prev);
            }
        });
    list.onInsert = (listener: OperationHandler<K, V>) => subscribe(upd['+'], listener);
    list.onDelete = (listener: OperationHandler<K, V>) => subscribe(upd['-'], listener);
    list.watch = (operations: BulkWatcher<K, V>) => {
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

/**
 * Creates a function that stops multiple subscriptions when called.
 */
export const stopify = (stoppers: Unsubscribe[]) => (): void => {
    for (const stop of stoppers) {
        stop();
    }
};
