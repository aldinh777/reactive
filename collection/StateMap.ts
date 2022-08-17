import { pushNonExists, removeFromArray } from '../util';

export type MapUpdateListener<T> = (key: string, next: T, previous: T) => any;
export type MapInsertListener<T> = (key: string, inserted: T) => any;
export type MapDeleteListener<T> = (key: string, deleted: T) => any;

export interface StateMapSubscription<T, U> {
    stateMap: StateMap<T>;
    listener: U;
    unsubscribe(): any;
    resubscribe(): any;
}
export interface StateMapObject<T> {
    [key: string]: T;
}

export class StateMap<T> {
    private _updateListeners: MapUpdateListener<T>[] = [];
    private _insertListeners: MapInsertListener<T>[] = [];
    private _deleteListeners: MapDeleteListener<T>[] = [];
    private _map: Map<string, T>;

    constructor(initial: StateMapObject<T> | Map<string, T> = new Map()) {
        if (initial instanceof Map) {
            this._map = initial;
        } else {
            this._map = new Map();
            for (const key in initial) {
                this._map.set(key, initial[key]);
            }
        }
    }
    clear(): void {
        const items = Array.from(this._map.entries());
        this._map.clear();
        for (const [key, deleted] of items) {
            for (const del of this._deleteListeners) {
                del(key, deleted);
            }
        }
    }
    delete(key: string): boolean {
        const item = this._map.get(key);
        const result = this._map.delete(key);
        if (result) {
            for (const del of this._deleteListeners) {
                del(key, item as T);
            }
        }
        return result;
    }
    get(key: string): T | undefined {
        return this._map.get(key);
    }
    has(key: string): boolean {
        return this._map.has(key);
    }
    set(key: string, value: T): this {
        if (this._map.has(key)) {
            const prev = this._map.get(key);
            for (const upd of this._updateListeners) {
                upd(key, value, prev as T);
            }
        } else {
            for (const ins of this._insertListeners) {
                ins(key, value);
            }
        }
        this._map.set(key, value);
        return this;
    }
    getRawMap(): Map<string, T> {
        return this._map;
    }
    onUpdate(listener: MapUpdateListener<T>): StateMapSubscription<T, MapUpdateListener<T>> {
        this._updateListeners.push(listener);
        return {
            stateMap: this,
            listener: listener,
            unsubscribe: () => removeFromArray(listener, this._updateListeners),
            resubscribe: () => pushNonExists(listener, this._updateListeners)
        };
    }
    onInsert(listener: MapInsertListener<T>): StateMapSubscription<T, MapInsertListener<T>> {
        this._insertListeners.push(listener);
        return {
            stateMap: this,
            listener: listener,
            unsubscribe: () => removeFromArray(listener, this._insertListeners),
            resubscribe: () => pushNonExists(listener, this._insertListeners)
        };
    }
    onDelete(listener: MapDeleteListener<T>): StateMapSubscription<T, MapDeleteListener<T>> {
        this._deleteListeners.push(listener);
        return {
            stateMap: this,
            listener: listener,
            unsubscribe: () => removeFromArray(listener, this._deleteListeners),
            resubscribe: () => pushNonExists(listener, this._deleteListeners)
        };
    }
}
