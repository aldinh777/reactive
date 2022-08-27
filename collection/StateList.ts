import { StateCollection } from './StateCollection';

export class StateList<T> extends StateCollection<number, T, T[]> {
    constructor(initial: T[] = []) {
        super();
        this._collect = initial;
    }
    get(index: number): T | undefined {
        return this._collect[index];
    }
    set(index: number, value: T) {
        const previous = this._collect[index];
        if (previous === value) {
            return this;
        }
        this._collect[index] = value;
        for (const upd of this._updListeners) {
            upd(index, value, previous);
        }
        return this;
    }
    raw(): T[] {
        return this._collect;
    }
    push(...items: T[]): number {
        const start = this._collect.length;
        const result = this._collect.push(...items);
        for (let i = 0; i < items.length; i++) {
            const insertIndex = start + i;
            for (const ins of this._insListeners) {
                ins(insertIndex, items[i]);
            }
        }
        return result;
    }
    pop(): T | undefined {
        const originalLength = this._collect.length;
        const item = this._collect.pop();
        if (originalLength > 0) {
            const deleteIndex = originalLength - 1;
            for (const del of this._delListeners) {
                del(deleteIndex, item as T);
            }
        }
        return item;
    }
    shift(): T | undefined {
        const originalLength = this._collect.length;
        const item = this._collect.shift();
        if (originalLength > 0) {
            const deleteIndex = 0;
            for (const del of this._delListeners) {
                del(deleteIndex, item as T);
            }
        }
        return item;
    }
    unshift(...items: T[]): number {
        const result = this._collect.unshift(...items);
        for (let i = 0; i < items.length; i++) {
            for (const ins of this._insListeners) {
                ins(i, items[i]);
            }
        }
        return result;
    }
    splice(start: number, deleteCount: number = 0, ...items: T[]) {
        const deletedItems = this._collect.splice(start, deleteCount, ...items);
        for (const deleted of deletedItems) {
            for (const del of this._delListeners) {
                del(start, deleted);
            }
        }
        for (let i = 0; i < items.length; i++) {
            const insertIndex = start + i;
            for (const ins of this._insListeners) {
                ins(insertIndex, items[i]);
            }
        }
        return deletedItems;
    }
}
