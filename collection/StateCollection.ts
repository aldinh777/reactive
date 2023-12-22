import { subscribe, Subscription } from '../helper/subscription-helper';

export type Operation = '+' | '-' | '=';

export type OperationHandler<K, V> = (index: K, value: V, prev: V) => any;
export type OperationListeners<K, V> = {
    [op in Operation]: OperationHandler<K, V>[];
};

/**
 * Abstract class to be extended as an actual observable collection
 *
 * - K -> Key | Index Type: (ex. number, string).
 * - V -> Value Type: (ex. number, string, object).
 * - R -> Raw Collection Type: (ex. string[], Map<string, string>).
 */
export abstract class StateCollection<K, V, R> {
    protected _upd: OperationListeners<K, V> = { '+': [], '-': [], '=': [] };
    raw!: R;

    abstract get(index: K): V | undefined;
    trigger(op: Operation, index: K, value: V, updated?: V): void {
        const handlers = this._upd[op];
        for (const handle of handlers || []) {
            handle(index, value, updated);
        }
    }
    onUpdate(listener: OperationHandler<K, V>): Subscription {
        return subscribe(listener, this._upd['='] || []);
    }
    onInsert(listener: OperationHandler<K, V>): Subscription {
        return subscribe(listener, this._upd['+'] || []);
    }
    onDelete(listener: OperationHandler<K, V>): Subscription {
        return subscribe(listener, this._upd['-'] || []);
    }
}

export interface MutableStateCollection<K, V, R> extends StateCollection<K, V, R> {
    set(index: K, value: V): this;
}
