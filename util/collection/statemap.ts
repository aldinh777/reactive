import { StateMapObject } from '../../collection/map/StateMap';
import { MutableStateMap } from '../../collection/map/MutableStateMap';

interface SimpleObject<T> {
    [key: string]: T;
}
export type StateMapProxy<T> = MutableStateMap<T> & SimpleObject<T>;

export function statemap<T>(map: StateMapObject<T> | Map<string, T>): StateMapProxy<T> {
    return new Proxy(new MutableStateMap(map), {
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
        }
    }) as StateMapProxy<T>;
}
