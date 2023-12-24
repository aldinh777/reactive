import { Subscription, subscribe } from './subscription-helper';
export type Operation = '+' | '-' | '=';
export type OperationHandler<K, V> = (key: K, value: V, prev: V) => any;
export type OperationListeners<K, V> = {
    [op in Operation]: OperationHandler<K, V>[];
};

export type Watchable<K, V> = {
    onUpdate(listener: OperationHandler<K, V>): Subscription;
    onInsert(listener: OperationHandler<K, V>): Subscription;
    onDelete(listener: OperationHandler<K, V>): Subscription;
};

export function watchify<K, V>(RData: any) {
    const upd: OperationListeners<K, V> = { '+': [], '-': [], '=': [] };
    const trigger = (op: Operation, key: K, value: V, updated?: V) => {
        const handlers = upd[op];
        for (const handle of handlers || []) {
            handle(key, value, updated);
        }
    };
    RData.onUpdate = (listener: OperationHandler<K, V>): Subscription => {
        return subscribe(listener, upd['=']);
    };
    RData.onInsert = (listener: OperationHandler<K, V>): Subscription => {
        return subscribe(listener, upd['+']);
    };
    RData.onDelete = (listener: OperationHandler<K, V>): Subscription => {
        return subscribe(listener, upd['-']);
    };
    return trigger;
}
