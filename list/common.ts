/**
 * @module
 * Shared module for types and function related to watchability
 */

type Operation = '+' | '-' | '=';
type OperationHandler<K, V> = (key: K, value: V, prev?: V) => any;
type OperationUpdateHandler<K, V> = (key: K, value: V, prev: V) => any;
type OperationListeners<K, V> = {
    [op in Operation]: Set<OperationHandler<K, V>>;
};

interface BulkWatcher<K, V> {
    update?: OperationUpdateHandler<K, V>;
    insert?: OperationHandler<K, V>;
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

function subscribe<L>(set: Set<L>) {
    return (listener: L) => {
        set.add(listener);
        return () => set.delete(listener);
    };
}

/**
 * Converts an object into Watchable and return a trigger function to trigger the updates.
 */
export function watchify<K, V>(list: any, unique: boolean = true): (op: Operation, key: K, value: V, prev?: V) => void {
    const listeners: OperationListeners<K, V> = { '+': new Set(), '-': new Set(), '=': new Set() };
    const trigger = (op: Operation, key: K, value: V, updated?: V) => {
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
