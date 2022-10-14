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
}
