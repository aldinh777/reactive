import { StateList } from './StateList';
import { StateMap, StateMapObject } from './StateMap';

export interface StateListProxy<T> extends StateList<T> {
    [index: number]: T;
}
interface SimpleObject<T> {
    [key: string]: T;
}
export type StateMapProxy<T> = StateMap<T> & SimpleObject<T>;

export function stateList<T>(list: T[]): StateListProxy<T> {
    return new Proxy(new StateList(list), {
        get(target, p, receiver) {
            if (typeof p === 'string') {
                const index = parseInt(p);
                if (Number.isInteger(index)) {
                    return target.at(index);
                }
            }
            return Reflect.get(target, p, receiver);
        },
        set(target, p, value, receiver) {
            if (typeof p === 'string') {
                const index = parseInt(p);
                if (Number.isInteger(index)) {
                    target.set(index, value);
                    return true
                }
            }
            return Reflect.set(target, p, value, receiver);
        },
    }) as StateListProxy<T>;
}

export function stateMap<T>(map: StateMapObject<T> | Map<string, T>): StateMapProxy<T> {
    return new Proxy(new StateMap(map), {
        get(target, p, receiver) {
            if (!Reflect.has(target, p)) {
                if (typeof p === 'string') {
                    return target.get(p);
                }
            }
            return Reflect.get(target, p, receiver);
        },
        set(target, p, value, receiver) {
            if (!Reflect.has(target, p)) {
                if (typeof p === 'string') {
                    target.set(p, value);
                    return true;
                }
            }
            return Reflect.set(target, p, value, receiver);
        },
    }) as StateMapProxy<T>;
}

export * from './StateList';
export * from './StateMap';
