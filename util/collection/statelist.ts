import { MutableStateList } from '../../collection/list/MutableStateList';

export interface StateListProxy<T> extends MutableStateList<T> {
    [index: number]: T;
}

export function statelist<T>(list: T[]): StateListProxy<T> {
    return new Proxy(new MutableStateList(list), {
        get(target, p, receiver) {
            if (typeof p === 'string') {
                const index = parseInt(p);
                if (Number.isInteger(index)) {
                    return target.get(index);
                }
            }
            return Reflect.get(target, p, receiver);
        },
        set(target, p, value, receiver) {
            if (typeof p === 'string') {
                const index = parseInt(p);
                if (Number.isInteger(index)) {
                    target.set(index, value);
                    return true;
                }
            }
            return Reflect.set(target, p, value, receiver);
        }
    }) as StateListProxy<T>;
}
