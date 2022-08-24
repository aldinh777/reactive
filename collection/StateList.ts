import { createSubscription, Subscription } from '../util';

export type ListUpdateListener<T> = (index: number, next: T, previous: T) => any;
export type ListInsertListener<T> = (index: number, inserted: T) => any;
export type ListDeleteListener<T> = (index: number, deleted: T) => any;
export type StateListSubscription<T, U> = Subscription<StateList<T>, U>;

export class StateList<T> {
    private _updateListeners: ListUpdateListener<T>[] = [];
    private _insertListeners: ListInsertListener<T>[] = [];
    private _deleteListeners: ListDeleteListener<T>[] = [];
    private _list: T[];

    constructor(initial: T[] = []) {
        this._list = initial;
    }
    at(index: number): T | undefined {
        return this._list[index];
    }
    set(index: number, value: T) {
        const previous = this._list[index];
        if (previous === value) {
            return;
        }
        this._list[index] = value;
        for (const upd of this._updateListeners) {
            upd(index, value, previous);
        }
    }
    push(...items: T[]): number {
        const start = this._list.length;
        const result = this._list.push(...items);
        for (let i = 0; i < items.length; i++) {
            const insertIndex = start + i;
            for (const ins of this._insertListeners) {
                ins(insertIndex, items[i]);
            }
        }
        return result;
    }
    pop(): T | undefined {
        const originalLength = this._list.length;
        const item = this._list.pop();
        if (originalLength > 0) {
            const deleteIndex = originalLength - 1;
            for (const del of this._deleteListeners) {
                del(deleteIndex, item as T);
            }
        }
        return item;
    }
    shift(): T | undefined {
        const originalLength = this._list.length;
        const item = this._list.shift();
        if (originalLength > 0) {
            const deleteIndex = 0;
            for (const del of this._deleteListeners) {
                del(deleteIndex, item as T);
            }
        }
        return item;
    }
    unshift(...items: T[]): number {
        const result = this._list.unshift(...items);
        for (let i = 0; i < items.length; i++) {
            for (const ins of this._insertListeners) {
                ins(i, items[i]);
            }
        }
        return result;
    }
    splice(start: number, deleteCount: number = 0, ...items: T[]) {
        const deletedItems = this._list.splice(start, deleteCount, ...items);
        for (const deleted of deletedItems) {
            for (const del of this._deleteListeners) {
                del(start, deleted);
            }
        }
        for (let i = 0; i < items.length; i++) {
            const insertIndex = start + i;
            for (const ins of this._insertListeners) {
                ins(insertIndex, items[i]);
            }
        }
        return deletedItems;
    }
    toArray(): T[] {
        return [...this._list];
    }
    onUpdate(listener: ListUpdateListener<T>): StateListSubscription<T, ListUpdateListener<T>> {
        this._updateListeners.push(listener);
        return createSubscription(this, listener, this._updateListeners);
    }
    onInsert(listener: ListInsertListener<T>): StateListSubscription<T, ListInsertListener<T>> {
        this._insertListeners.push(listener);
        return createSubscription(this, listener, this._insertListeners);
    }
    onDelete(listener: ListDeleteListener<T>): StateListSubscription<T, ListDeleteListener<T>> {
        this._deleteListeners.push(listener);
        return createSubscription(this, listener, this._deleteListeners);
    }
}
