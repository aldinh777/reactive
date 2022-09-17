import { StateCollection } from './StateCollection';

export class StateList<T> extends StateCollection<number, T, T[]> {
    constructor(initial: T[] = []) {
        super();
        this.raw = initial;
    }
    get(index: number): T | undefined {
        return this.raw[index];
    }
    set(index: number, value: T) {
        const previous = this.raw[index];
        if (previous === value) {
            return this;
        }
        this.raw[index] = value;
        for (const upd of this._upd) {
            upd(index, value, previous);
        }
        return this;
    }
    push(...items: T[]): number {
        const start = this.raw.length;
        const result = this.raw.push(...items);
        for (let i = 0; i < items.length; i++) {
            const insertIndex = start + i;
            for (const ins of this._ins) {
                ins(insertIndex, items[i]);
            }
        }
        return result;
    }
    pop(): T | undefined {
        const originalLength = this.raw.length;
        const item = this.raw.pop();
        if (originalLength > 0) {
            const deleteIndex = originalLength - 1;
            for (const del of this._del) {
                del(deleteIndex, item as T);
            }
        }
        return item;
    }
    shift(): T | undefined {
        const originalLength = this.raw.length;
        const item = this.raw.shift();
        if (originalLength > 0) {
            const deleteIndex = 0;
            for (const del of this._del) {
                del(deleteIndex, item as T);
            }
        }
        return item;
    }
    unshift(...items: T[]): number {
        const result = this.raw.unshift(...items);
        for (let i = 0; i < items.length; i++) {
            for (const ins of this._ins) {
                ins(i, items[i]);
            }
        }
        return result;
    }
    splice(start: number, deleteCount: number = 0, ...items: T[]) {
        const deletedItems = this.raw.splice(start, deleteCount, ...items);
        for (const deleted of deletedItems) {
            for (const del of this._del) {
                del(start, deleted);
            }
        }
        for (let i = 0; i < items.length; i++) {
            const insertIndex = start + i;
            for (const ins of this._ins) {
                ins(insertIndex, items[i]);
            }
        }
        return deletedItems;
    }
}
