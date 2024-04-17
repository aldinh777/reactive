import type { WatchableList } from './watchable.js';
import { watchify } from './watchable.js';

export interface ReactiveList<T> extends WatchableList<T> {
    (key: number, value: T): ReactiveList<T>;
    push(...items: T[]): number;
    pop(): T | undefined;
    shift(): T | undefined;
    unshift(...items: T[]): number;
    splice(start: number, deleteCount?: number, ...items: T[]): T[];
}

export function list<T>(initial: T[] = []) {
    const raw = initial;
    const ReactiveList = (...arg: [number?, T?]) => {
        if (!arg.length) {
            return raw;
        }
        const [key, value] = arg;
        if (arg.length === 1) {
            return raw[key];
        }
        const prev = raw[key];
        raw[key] = value;
        trigger('=', key, value, prev);
        return ReactiveList;
    };
    const trigger = watchify(ReactiveList);
    ReactiveList.push = (...items: T[]): number => {
        ReactiveList.splice(raw.length, 0, ...items);
        return raw.length;
    };
    ReactiveList.pop = (): T | undefined => {
        return ReactiveList.splice(raw.length - 1, 1)[0];
    };
    ReactiveList.shift = (): T | undefined => {
        return ReactiveList.splice(0, 1)[0];
    };
    ReactiveList.unshift = (...items: T[]): number => {
        ReactiveList.splice(0, 0, ...items);
        return raw.length;
    };
    ReactiveList.splice = (start: number, deleteCount: number = 0, ...items: T[]): T[] => {
        const deletedItems = raw.splice(start, deleteCount, ...items);
        for (const deleted of deletedItems) {
            trigger('-', start, deleted);
        }
        for (let i = 0; i < items.length; i++) {
            trigger('+', start + i, items[i]);
        }
        return deletedItems;
    };
    ReactiveList.toString = () => `ReactiveList [ ${raw.join(', ')} ]`;
    return ReactiveList as ReactiveList<T>;
}
