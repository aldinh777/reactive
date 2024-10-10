import { ObservedList, WatchableList, stopify, watchify } from './watchable.js';

export const lt = (item: any, elem: any) => item < elem;

/**
 * Creates a reactive list that is filtered based on the specified list input.
 * @param {WatchableList<T>} list The reactive list to be filtered.
 * @param {Function} fn The function to filter the items.
 * @returns {ObservedList<T>} A new reactive list that is filtered based on the specified list input.
 */
export function filter<T>(list: WatchableList<T>, fn: (item: T) => boolean): ObservedList<T> {
    const raw: T[] = [];
    const _f: boolean[] = list().map(fn);
    for (let i = 0; i < _f.length; i++) {
        if (_f[i]) {
            raw.push(list(i));
        }
    }
    const updateFiltered = (index: number, value: T, prev: T): void => {
        const fIndex = findFilteredIndex(index);
        raw[fIndex] = value;
        trigger('=', fIndex, value, prev);
    };
    const insertFiltered = (index: number, value: T): void => {
        const fIndex = findFilteredIndex(index);
        raw.splice(fIndex, 0, value);
        trigger('+', fIndex, value);
    };
    const deleteFiltered = (index: number, _value: T): void => {
        const fIndex = findFilteredIndex(index);
        const prev = raw[fIndex];
        raw.splice(fIndex, 1);
        trigger('-', fIndex, prev);
    };
    const findFilteredIndex = (sourceIndex: number): number => {
        let filteredIndex = 0;
        for (let i = 0; i < sourceIndex; i++) {
            if (_f[i]) {
                filteredIndex++;
            }
        }
        return filteredIndex;
    };
    const FilteredList = (index?: number) => {
        if (index === undefined) {
            return [...raw];
        }
        return raw[index];
    };
    const trigger = watchify(FilteredList);
    FilteredList.stop = stopify([
        list.onUpdate((index, value, prev) => {
            const allowAfter = fn(value);
            if (_f[index] !== allowAfter) {
                _f[index] = allowAfter;
                if (allowAfter) {
                    insertFiltered(index, value);
                } else {
                    deleteFiltered(index, value);
                }
            } else if (allowAfter) {
                updateFiltered(index, value, prev);
            }
        }),
        list.onInsert((index, value) => {
            const allow = fn(value);
            _f.splice(index, 0, allow);
            if (allow) {
                insertFiltered(index, value);
            }
        }),
        list.onDelete((index, value) => {
            if (_f[index]) {
                deleteFiltered(index, value);
            }
            _f.splice(index, 1);
        })
    ]);
    FilteredList.filter = (fn: (item: T) => boolean) => filter(FilteredList as any as WatchableList<T>, fn);
    FilteredList.map = <U>(fn: (item: T) => U) => map(FilteredList as any as WatchableList<T>, fn);
    FilteredList.sort = (fn: (item: T, elem: T) => boolean = lt) => sort(FilteredList as any as WatchableList<T>, fn);
    FilteredList.toString = () => `FilteredList [ ${raw.join(', ')} ]`;
    return FilteredList as ObservedList<T>;
}

/**
 * Creates a reactive list that is mapped based on the specified list input.
 * @param {WatchableList<S>} list The reactive list to be mapped.
 * @param {Function} fn The function to map the items.
 * @returns {ObservedList<T>} A new reactive list that is mapped based on the specified list input.
 */
export function map<S, T>(list: WatchableList<S>, fn: (item: S) => T): ObservedList<T> {
    const raw: T[] = [];
    for (const item of list()) {
        raw.push(fn(item));
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
            const mapped = fn(value);
            const before = raw[index];
            if (mapped !== before) {
                raw[index] = mapped;
                trigger('=', index, mapped, before);
            }
        }),
        list.onInsert((index, value) => {
            const mapped = fn(value);
            raw.splice(index, 0, mapped);
            trigger('+', index, mapped);
        }),
        list.onDelete((index) => {
            const value = raw[index];
            raw.splice(index, 1);
            trigger('-', index, value);
        })
    ]);
    MappedList.filter = (fn: (item: T) => boolean) => filter(MappedList as any as WatchableList<T>, fn);
    MappedList.map = <U>(fn: (item: T) => U) => map(MappedList as any as WatchableList<T>, fn);
    MappedList.sort = (fn: (item: T, elem: T) => boolean = lt) => sort(MappedList as any as WatchableList<T>, fn);
    MappedList.toString = () => `MappedList [ ${raw.join(', ')} ]`;
    return MappedList as ObservedList<T>;
}

/**
 * Creates a reactive list that is sorted based on the specified list input.
 * @param {WatchableList<T>} list The reactive list to be sorted.
 * @param {Function} fn The function to sort the items.
 * @returns {ObservedList<T>} A new reactive list that is sorted based on the specified list input.
 */
export function sort<T>(list: WatchableList<T>, fn: (item: T, elem: T) => boolean): ObservedList<T> {
    const raw: T[] = [];
    const insertItem = (array: T[], item: T): number => {
        let insertIndex = array.length;
        for (let i = 0; i < array.length; i++) {
            const elem = array[i];
            if (fn(item, elem)) {
                insertIndex = i;
                break;
            }
        }
        array.splice(insertIndex, 0, item);
        return insertIndex;
    };
    for (const item of list()) {
        insertItem(raw, item);
    }
    const SortedList = (index?: number) => {
        if (index === undefined) {
            return [...raw];
        }
        return raw[index];
    };
    const trigger = watchify(SortedList);
    SortedList.stop = stopify([
        list.onUpdate((_, value, prev) => {
            const prevIndex = raw.indexOf(prev);
            if (prevIndex !== -1) {
                raw.splice(prevIndex, 1);
                const nextIndex = insertItem(raw, value);
                if (prevIndex === nextIndex) {
                    trigger('=', nextIndex, value, prev);
                } else {
                    trigger('-', prevIndex, prev);
                    trigger('+', nextIndex, value);
                }
            }
        }),
        list.onInsert((_, value) => {
            const insertIndex = insertItem(raw, value);
            trigger('+', insertIndex, value);
        }),
        list.onDelete((_, value) => {
            const index = raw.indexOf(value);
            if (index !== -1) {
                raw.splice(index, 1);
                trigger('-', index, value);
            }
        })
    ]);
    SortedList.filter = (fn: (item: T) => boolean) => filter(SortedList as any as WatchableList<T>, fn);
    SortedList.map = <U>(fn: (item: T) => U) => map(SortedList as any as WatchableList<T>, fn);
    SortedList.sort = (fn: (item: T, elem: T) => boolean = lt) => sort(SortedList as any as WatchableList<T>, fn);
    SortedList.toString = () => `SortedList [ ${raw.join(', ')} ]`;
    return SortedList as ObservedList<T>;
}
