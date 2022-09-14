import { createSubscription, Subscription } from '../util';

export type UpdateListener<K, V> = (index: K, next: V, previous: V) => any;
export type InsertListener<K, V> = (index: K, inserted: V) => any;
export type DeleteListener<K, V> = (index: K, deleted: V) => any;
export type ResizeListener<K, V> = (type: 'insert' | 'delete', index: K, item: V) => any;
export type CollectSubscription<K, V, C, U> = Subscription<StateCollection<K, V, C>, U>;

/**
 * - K -> Key | Index Type.
 * - V -> Value Type.
 * - R -> Raw Collection Type.
 *
 * ex: StateList of string makes :
 * - K: number as it's index
 * - V: string as it's output
 * - R: string[] to store it's raw data internally
 */
export abstract class StateCollection<K, V, R> {
    protected _updListeners: UpdateListener<K, V>[] = [];
    protected _insListeners: InsertListener<K, V>[] = [];
    protected _delListeners: DeleteListener<K, V>[] = [];
    protected _collect!: R;

    abstract get(index: K): V | undefined;
    abstract set(index: K, value: V): this;
    abstract raw(): R;
    onUpdate(listener: UpdateListener<K, V>): CollectSubscription<K, V, R, UpdateListener<K, V>> {
        return createSubscription(this, listener, this._updListeners);
    }
    onInsert(listener: InsertListener<K, V>): CollectSubscription<K, V, R, InsertListener<K, V>> {
        return createSubscription(this, listener, this._insListeners);
    }
    onDelete(listener: DeleteListener<K, V>): CollectSubscription<K, V, R, DeleteListener<K, V>> {
        return createSubscription(this, listener, this._delListeners);
    }
    onResize(listener: ResizeListener<K, V>): CollectSubscription<K, V, R, ResizeListener<K, V>> {
        const subins = this.onInsert((index, inserted) => listener('insert', index, inserted));
        const subdel = this.onDelete((index, deleted) => listener('delete', index, deleted));
        return {
            target: this,
            listener: listener,
            unsub() {
                subins.unsub();
                subdel.unsub();
            },
            resub() {
                subins.resub();
                subdel.resub();
            }
        };
    }
}
