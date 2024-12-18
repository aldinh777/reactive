/**
 * @module
 * Shared module for types and function related to watchability
 */

import { subscribe } from './subscription.ts';

/**
 * Represents the operation type of a watchable list.
 */
type Operation = '+' | '-' | '=';

/**
 * Represents the handler function for a watchable list operation.
 */
type OperationHandler<K, V> = (key: K, value: V, prev?: V) => any;

/**
 * Represents the handler function for a list update operation.
 */
type OperationUpdateHandler<K, V> = (key: K, value: V, prev: V) => any;

/**
 * Represents the map of operation listeners.
 */
type OperationListeners<K, V> = {
    [op in Operation]: Set<OperationHandler<K, V>>;
};

/**
 * Represents the bulk watcher interface.
 */
interface BulkWatcher<K, V> {
    /**
     * Registers a listener to be called whenever an update operation occurs.
     */
    update?: OperationUpdateHandler<K, V>;

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
 * Represents a watchable object with operations to observe changes.
 */
export interface Watchable<K, V> {
    /**
     * Registers a listener to be called whenever an update operation occurs.
     */
    onUpdate(listener: OperationUpdateHandler<K, V>): () => void;

    /**
     * Registers a listener to be called whenever an insert operation occurs.
     */
    onInsert(listener: OperationHandler<K, V>): () => void;

    /**
     * Registers a listener to be called whenever a delete operation occurs.
     */
    onDelete(listener: OperationHandler<K, V>): () => void;

    /**
     * Registers necessary listeners to observe multiple types of operations.
     */
    watch(operations: BulkWatcher<K, V>): () => void;
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
    filter(fn: (item: T) => boolean): WatchableList<T>;

    /**
     * Creates a new observed list that maps the elements of the list based on the given function.
     */
    map<U>(fn: (item: T) => U): WatchableList<U>;

    /**
     * Creates a new observed list that sorts the elements of the list based on the given function.
     */
    sort(fn?: (item: T, elem: T) => boolean): WatchableList<T>;
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
