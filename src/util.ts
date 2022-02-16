import { ReactiveArray } from './collection/ReactiveArray';
import { ReactiveCollection } from './collection/ReactiveCollection';
import { ReactiveMap } from './collection/ReactiveMap';
import { Reactive, Rule } from './Reactive';

export type ReactiveTimeout = Reactive<ReturnType<typeof setTimeout> | undefined>;
export type ReactiveInterval = Reactive<ReturnType<typeof setInterval> | undefined>;

export function removeFromArray<T>(elem: T, array: T[]): void {
    const index = array.indexOf(elem);
    if (index !== -1) {
        array.splice(index, 1);
    }
}

export function reactive<T>(initial?: T | Rule<T>, ...subscriptions: Reactive<any>[]): Reactive<T> {
    return new Reactive(initial, ...subscriptions);
}

function parseRecollection(obj: any, rawdata: boolean = false, mapper: WeakMap<any, any>): any {
    if (mapper.has(obj)) {
        return mapper.get(obj);
    }
    let result: ReactiveCollection<any>;
    if (obj instanceof Reactive || obj instanceof ReactiveCollection) {
        return obj;
    } else if (obj instanceof Array) {
        const arr = new ReactiveArray();
        mapper.set(obj, arr);
        arr.push(...obj.map(o => parseRecollection(o, true, mapper)));
        result = arr;
    } else if (typeof obj === 'object') {
        const map = new ReactiveMap();
        mapper.set(obj, map);
        for (const key in obj) {
            const value = obj[key];
            map.set(key, parseRecollection(value, true, mapper));
        }
        result = map;
    } else {
        return obj;
    }
    if (rawdata) {
        return result;
    } else {
        return result.toProxy();
    }
}

export function recollection(obj: any, rawdata: boolean = false): ReactiveCollection<any> {
    return parseRecollection(obj, rawdata, new WeakMap());
}

export function reactiveTimeout(timeout?: ReturnType<typeof setTimeout>): ReactiveTimeout {
    const val: ReactiveTimeout = reactive(timeout) as ReactiveTimeout;
    val.onChange((_, ev) => {
        if (ev.oldValue !== undefined) {
            clearTimeout(ev.oldValue);
        }
    });
    return val;
}

export function reactiveInteval(interval?: ReturnType<typeof setInterval>): ReactiveInterval {
    const val: ReactiveInterval = reactive(interval) as ReactiveInterval;
    val.onChange((_, ev) => {
        if (ev.oldValue !== undefined) {
            clearInterval(ev.oldValue);
        }
    });
    return val;
}
