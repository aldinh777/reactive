import type { Watchable } from '../utils/watchable.js';
import { watchify } from '../utils/watchable.js';

export interface ObservedList<T, M> extends WatchableList<T> {
    replaceMutator: M;
    stop(): void;
}

export interface WatchableList<T> extends Watchable<number, T> {
    (): T[];
    (key: number): T;
}

export interface RList<T> extends Watchable<number, T>, WatchableList<T> {
    (key: number, value: T): RList<T>;
    push(...items: T[]): number;
    pop(): T | undefined;
    shift(): T | undefined;
    unshift(...items: T[]): number;
    splice(start: number, deleteCount?: number, ...items: T[]): T[];
}

export function list<T>(initial: T[] = []) {
    const raw = initial;
    const RList = (...arg: [number?, T?]) => {
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
        return RList;
    };
    const trigger = watchify(RList);
    RList.push = (...items: T[]): number => {
        RList.splice(raw.length, 0, ...items);
        return raw.length;
    };
    RList.pop = (): T | undefined => {
        return RList.splice(raw.length - 1, 1)[0];
    };
    RList.shift = (): T | undefined => {
        return RList.splice(0, 1)[0];
    };
    RList.unshift = (...items: T[]): number => {
        RList.splice(0, 0, ...items);
        return raw.length;
    };
    RList.splice = (start: number, deleteCount: number = 0, ...items: T[]): T[] => {
        const deletedItems = raw.splice(start, deleteCount, ...items);
        for (const deleted of deletedItems) {
            trigger('-', start, deleted);
        }
        for (let i = 0; i < items.length; i++) {
            trigger('+', start + i, items[i]);
        }
        return deletedItems;
    };
    return RList as RList<T>;
}
