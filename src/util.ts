import { ReactiveArray } from './collection/ReactiveArray';
import { ReactiveCollection } from './collection/ReactiveCollection';
import { ReactiveMap } from './collection/ReactiveMap';
import { Reactive, Rule } from './Reactive';

export function removeFromArray<T>(elem: T, array: T[]): void {
    const index = array.indexOf(elem);
    if (index !== -1) {
        array.splice(index, 1);
    }
}

export function reactive<T>(initial?: T | Rule<T>, ...subscriptions: Reactive<any>[]): Reactive<T> {
    return new Reactive(initial, ...subscriptions);
}

export function recollection(obj: any, rawdata: boolean = false): ReactiveCollection<any> {
    let result: ReactiveCollection<any>;
    if (obj instanceof Array) {
        result = new ReactiveArray(...obj.map(o => recollection(o, true)));
    } else if (typeof obj === 'object') {
        const map = new ReactiveMap();
        for (const key in obj) {
            const value = obj[key];
            map.set(key, recollection(value, true));
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
