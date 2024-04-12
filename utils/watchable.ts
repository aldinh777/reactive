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

export interface Stoppable {
    stop(): void;
}

export interface Watchable<K, V> {
    onUpdate(listener: OperationHandler<K, V>): Unsubscribe;
    onInsert(listener: OperationHandler<K, V>): Unsubscribe;
    onDelete(listener: OperationHandler<K, V>): Unsubscribe;
    watch(operations: BulkWatcher<K, V>): Unsubscribe;
}

export function watchify<K, V>(RData: any) {
    const upd: OperationListeners<K, V> = { '+': [], '-': [], '=': [] };
    const trigger = (op: Operation, key: K, value: V, updated?: V) => {
        const handlers = upd[op];
        for (const handle of handlers || []) {
            handle(key, value, updated);
        }
    };
    RData.onUpdate = (listener: OperationHandler<K, V>) => subscribe(upd['='], listener);
    RData.onInsert = (listener: OperationHandler<K, V>) => subscribe(upd['+'], listener);
    RData.onDelete = (listener: OperationHandler<K, V>) => subscribe(upd['-'], listener);
    RData.watch = (operations: BulkWatcher<K, V>) => {
        const unsubs: Unsubscribe[] = [];
        if (operations.update) {
            unsubs.push(subscribe(upd['='], operations.update));
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
    RData.toString = () => 'Reactive Collection {}';
    return trigger;
}

export const stopify = (stoppers: Unsubscribe[]) => () => {
    for (const stop of stoppers) {
        stop();
    }
};
