import { StateCollection } from './StateCollection';

export interface StateMapObject<T> {
    [key: string]: T;
}

export class StateMap<T> extends StateCollection<string, T, Map<string, T>> {
    constructor(initial: StateMapObject<T> | Map<string, T> = new Map()) {
        super();
        if (initial instanceof Map) {
            this.raw = initial;
        } else {
            this.raw = new Map();
            for (const key in initial) {
                this.raw.set(key, initial[key]);
            }
        }
    }
    get(key: string): T | undefined {
        return this.raw.get(key);
    }
    set(key: string, value: T): this {
        if (this.raw.has(key)) {
            const prev = this.raw.get(key);
            this.raw.set(key, value);
            this.trigger('set', key, value, prev);
        } else {
            this.raw.set(key, value);
            this.trigger('ins', key, value);
        }
        return this;
    }
    clear(): void {
        const items = Array.from(this.raw.entries());
        this.raw.clear();
        for (const [key, deleted] of items) {
            this.trigger('del', key, deleted);
        }
    }
    delete(key: string): boolean {
        const item = this.raw.get(key);
        const result = this.raw.delete(key);
        if (result) {
            this.trigger('del', key, item as T);
        }
        return result;
    }
}
