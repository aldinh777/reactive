import type { Unsubscribe } from '../utils/subscription.js';
import { subscribe } from '../utils/subscription.js';

export type Operation = '+' | '-' | '=';
export type OperationHandler<K, V> = (key: K, value: V, prev: V) => any;
export type OperationListeners<K, V> = {
    [op in Operation]: OperationHandler<K, V>[];
};

interface BulkWatcher<K, V> {
    update?: OperationHandler<K, V>;
    insert?: OperationHandler<K, V>;
    delete?: OperationHandler<K, V>;
}

export interface Watchable<K, V> {
    onUpdate(listener: OperationHandler<K, V>): Unsubscribe;
    onInsert(listener: OperationHandler<K, V>): Unsubscribe;
    onDelete(listener: OperationHandler<K, V>): Unsubscribe;
    watch(operations: BulkWatcher<K, V>): Unsubscribe;
}

export interface WatchableList<T> extends Watchable<number, T> {
    (): T[];
    (key: number): T;
}

export interface ObservedList<T> extends WatchableList<T> {
    stop(): void;
}

export function watchify<K, V>(Watchable: any) {
    const upd: OperationListeners<K, V> = { '+': [], '-': [], '=': [] };
    const trigger = (op: Operation, key: K, value: V, updated?: V) => {
        const handlers = upd[op];
        for (const handle of handlers || []) {
            handle(key, value, updated);
        }
    };
    Watchable.onUpdate = (listener: OperationHandler<K, V>) =>
        subscribe(upd['='], (key, value, prev) => {
            if (value !== prev) {
                listener(key, value, prev);
            }
        });
    Watchable.onInsert = (listener: OperationHandler<K, V>) => subscribe(upd['+'], listener);
    Watchable.onDelete = (listener: OperationHandler<K, V>) => subscribe(upd['-'], listener);
    Watchable.watch = (operations: BulkWatcher<K, V>) => {
        const unsubs: Unsubscribe[] = [];
        if (operations.update) {
            unsubs.push(
                subscribe(upd['='], (key, value, prev) => {
                    if (value !== prev) {
                        operations.update(key, value, prev);
                    }
                })
            );
        }
        if (operations.insert) {
            unsubs.push(subscribe(upd['+'], operations.insert));
        }
        if (operations.delete) {
            unsubs.push(subscribe(upd['-'], operations.delete));
        }
        return () => {
            for (const unsub of unsubs) {
                unsub();
            }
        };
    };
    Watchable.toString = () => 'Watchable {}';
    return trigger;
}

export const stopify = (stoppers: Unsubscribe[]) => () => {
    for (const stop of stoppers) {
        stop();
    }
};
