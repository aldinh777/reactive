import { createSubscription, Subscription } from '../util/helper';

export type Operation = 'ins' | 'del' | 'set';

export type OperationHandler<K, V> = (index: K, value: V, ...rest: any[]) => any;
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
    protected _upd: OperationListeners<K, V> = { ins: [], del: [], set: [] };
    raw!: R;

    abstract get(index: K): V | undefined;
    abstract set(index: K, value: V): this;
    trigger(op: Operation, index: K, value: V, ...rest: any[]): void {
        const handlers = this._upd[op];
        for (const handle of handlers || []) {
            handle(index, value, ...rest);
        }
    }
    onUpdate(
        listener: OperationHandler<K, V>
    ): Subscription<StateCollection<K, V, R>, OperationHandler<K, V>> {
        return createSubscription(this, listener, this._upd.set || []);
    }
    onInsert(
        listener: OperationHandler<K, V>
    ): Subscription<StateCollection<K, V, R>, OperationHandler<K, V>> {
        return createSubscription(this, listener, this._upd.ins || []);
    }
    onDelete(
        listener: OperationHandler<K, V>
    ): Subscription<StateCollection<K, V, R>, OperationHandler<K, V>> {
        return createSubscription(this, listener, this._upd.del || []);
    }
}
