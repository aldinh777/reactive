import { StateCollection } from './StateCollection';

export interface StateMapObject<T> {
    [key: string]: T;
}

export class StateMap<T> extends StateCollection<string, T, Map<string, T>> {
    constructor(initial: StateMapObject<T> | Map<string, T> = new Map()) {
        super();
        if (initial instanceof Map) {
            this._collect = initial;
        } else {
            this._collect = new Map();
            for (const key in initial) {
                this._collect.set(key, initial[key]);
            }
        }
    }
    get(key: string): T | undefined {
        return this._collect.get(key);
    }
    set(key: string, value: T): this {
        if (this._collect.has(key)) {
            const prev = this._collect.get(key);
            for (const upd of this._updListeners) {
                upd(key, value, prev as T);
            }
        } else {
            for (const ins of this._insListeners) {
                ins(key, value);
            }
        }
        this._collect.set(key, value);
        return this;
    }
    raw(): Map<string, T> {
        return this._collect;
    }
    clear(): void {
        const items = Array.from(this._collect.entries());
        this._collect.clear();
        for (const [key, deleted] of items) {
            for (const del of this._delListeners) {
                del(key, deleted);
            }
        }
    }
    delete(key: string): boolean {
        const item = this._collect.get(key);
        const result = this._collect.delete(key);
        if (result) {
            for (const del of this._delListeners) {
                del(key, item as T);
            }
        }
        return result;
    }
    has(key: string): boolean {
        return this._collect.has(key);
    }
}
