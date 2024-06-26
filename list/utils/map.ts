import { ObservedList, WatchableList, stopify, watchify } from '../watchable.js';

/**
 * create a reactive list that is mapped based on the specified list input 
 */
export function map<S, T>(
    list: WatchableList<S>,
    map: (item: S) => T,
    remap?: (item: S, elem: T) => any
): ObservedList<T> {
    let om: WeakMap<object, T> = new WeakMap();
    const raw: T[] = [];
    const mapItem = (item: S, replace: boolean = true): T => {
        if (!(remap && typeof item === 'object')) {
            return map(item);
        }
        if (!replace && om.has(item)) {
            const elem = om.get(item) as T;
            remap(item, elem);
            return elem;
        }
        const mapped = map(item);
        om.set(item, mapped);
        return mapped;
    };
    for (const item of list()) {
        raw.push(mapItem(item));
    }
    const MappedList = (index?: number) => {
        if (index === undefined) {
            return [...raw];
        }
        return raw[index];
    };
    const trigger = watchify(MappedList);
    MappedList.stop = stopify([
        list.onUpdate((index, value) => {
            const mapped = mapItem(value, false);
            const before = raw[index];
            if (mapped !== before) {
                raw[index] = mapped;
                trigger('=', index, mapped, before);
            }
        }),
        list.onInsert((index, value) => {
            const mapped = mapItem(value, false);
            raw.splice(index, 0, mapped);
            trigger('+', index, mapped);
        }),
        list.onDelete((index) => {
            const value = raw[index];
            raw.splice(index, 1);
            trigger('-', index, value);
        })
    ]);
    MappedList.toString = () => `MappedList [ ${raw.join(', ')} ]`;
    return MappedList as ObservedList<T>;
}
