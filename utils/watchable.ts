import type { Unsubscribe } from '../utils/subscription.js';
import { subscribe } from '../utils/subscription.js';

export type Operation = '+' | '-' | '=';
export type OperationHandler<K, V> = (key: K, value: V, prev: V) => any;
export type OperationListeners<K, V> = {
    [op in Operation]: OperationHandler<K, V>[];
};

export interface Stoppable {
    stop(): void;
}

export interface Watchable<K, V> {
    onUpdate(listener: OperationHandler<K, V>): Unsubscribe;
    onInsert(listener: OperationHandler<K, V>): Unsubscribe;
    onDelete(listener: OperationHandler<K, V>): Unsubscribe;
}

export function watchify<K, V>(RData: any) {
    const upd: OperationListeners<K, V> = { '+': [], '-': [], '=': [] };
    const trigger = (op: Operation, key: K, value: V, updated?: V) => {
        const handlers = upd[op];
        for (const handle of handlers || []) {
            handle(key, value, updated);
        }
    };
    RData.onUpdate = (listener: OperationHandler<K, V>) => subscribe(listener, upd['=']);
    RData.onInsert = (listener: OperationHandler<K, V>) => subscribe(listener, upd['+']);
    RData.onDelete = (listener: OperationHandler<K, V>) => subscribe(listener, upd['-']);
    return trigger;
}

export const stopify = (stoppers: Unsubscribe[]) => () => {
    for (const stop of stoppers) {
        stop();
    }
};
