/**
 * @module
 * Base module that expose definition and function to create Reactive List
 */

import type { WatchableList } from './utils.ts';
import { watchify } from './common.ts';
import { filter, map, sort } from './utils.ts';

/**
 * An interface to mimic the basic functionality of insertion and deletion of an array
 */
export interface ReactiveList<T> extends WatchableList<T> {
    (key: number, value: T): ReactiveList<T>;
    push(...items: T[]): number;
    pop(): T | undefined;
    shift(): T | undefined;
    unshift(...items: T[]): number;
    splice(start: number, deleteCount?: number, ...items: T[]): T[];
}

const EMPTY = Symbol('empty');

/**
 * Create a Reactive List that mimic the basic functionality of an array
 * and is capable of watching any updates from it.
 *
 * operation includes:
 * - insertion : push, unshift, splice
 * - deletion : pop, shift, splice
 * - updates
 *
 * @param initial - The initial list of elements to be used
 * @param unique - Trigger update listener only if value changed (default=true)
 * @returns A reactive list that is capable of watching any updates from it
 */
export function list<T>(initial: T[] = [], unique: boolean = true): ReactiveList<T> {
    const raw = [...initial];
    const ReactiveList = (key: number | typeof EMPTY = EMPTY, value: T | typeof EMPTY = EMPTY) => {
        if (key === EMPTY) {
            return [...raw];
        }
        if (value === EMPTY) {
            return raw[key!];
        }
        const prev = raw[key!];
        raw[key!] = value!;
        trigger('=', key, value, prev);
        return ReactiveList;
    };
    const trigger = watchify(ReactiveList, unique);
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
    ReactiveList.filter = (fn: (item: T) => boolean) => filter(ReactiveList as any as WatchableList<T>, fn);
    ReactiveList.map = (fn: (item: T) => boolean) => map(ReactiveList as any as WatchableList<T>, fn);
    ReactiveList.sort = (fn?: (item: T, elem: T) => boolean) => sort(ReactiveList as any as WatchableList<T>, fn);
    return ReactiveList as ReactiveList<T>;
}
