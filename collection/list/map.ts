import type { WatchableList } from '../list.js';
import type { Stoppable } from '../../utils/watchable.js';
import { watchify } from '../../utils/watchable.js';

interface RListMap<S, T> extends WatchableList<T>, Stoppable {
    replaceMapper(mapper: (item: S) => T): void;
}

export function maplist<S, T>(list: WatchableList<S>, map: (item: S) => T, remap?: (item: S, elem: T) => T) {
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
    const unsubUpdate = list.onUpdate((index, value, prev) => {
        const mapped = mapItem(value, prev === value);
        const before = raw[index];
        if (mapped !== before) {
            raw[index] = mapped;
            trigger('=', index, mapped, before);
        }
    });
    const unsubInsert = list.onInsert((index, value) => {
        const mapped = mapItem(value, false);
        raw.splice(index, 0, mapped);
        trigger('+', index, mapped);
    });
    const unsubDelete = list.onDelete((index) => {
        const value = raw[index];
        raw.splice(index, 1);
        trigger('-', index, value);
    });
    const RListMap = (index?: number) => {
        if (index === undefined) {
            return raw;
        }
        return raw[index];
    };
    const trigger = watchify(RListMap);
    RListMap.replaceMapper = (mapper: (item: S) => T): void => {
        map = mapper;
        om = new WeakMap();
        for (let i = 0; i < list().length; i++) {
            const item = list(i);
            const prev = raw[i];
            const value = mapItem(item);
            raw[i] = value;
            trigger('=', i, value, prev);
        }
    };
    RListMap.stop = () => {
        unsubUpdate();
        unsubInsert();
        unsubDelete();
    };
    return RListMap as RListMap<S, T>;
}
