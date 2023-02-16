import { StateCollection } from './StateCollection';

export interface StateMapObject<T> {
    [key: string]: T;
}

export class StateMap<T = unknown> extends StateCollection<string, T, Map<string, T>> {
    constructor(initial: StateMapObject<T> | Map<string, T> = new Map()) {
        super();
        const isMapObject = initial instanceof Map;
        this.raw = isMapObject ? initial : new Map();
        if (!isMapObject) {
            for (const key in initial) {
                this.raw.set(key, initial[key]);
            }
        }
    }
    get(key: string): T | undefined {
        return this.raw.get(key);
    }
}
