/**
 * @module
 * List utilities to manipulate reactive list
 */
import type { Unsubscribe } from '../common/subscription.ts';
import type { ObservedList, WatchableList } from '../common/watchable.ts';
import { watchify } from '../common/watchable.ts';

function observy<T>(list: ObservedList<T>, subscribe: () => Unsubscribe) {
    let unsubscribe: Unsubscribe | undefined;
    let totalObservers = 0;
    const nativeOnUpdate = list.onUpdate;
    const nativeOnInsert = list.onInsert;
    const nativeOnDelete = list.onDelete;
    const customListener = (handler: typeof nativeOnUpdate | typeof nativeOnInsert) => (listener: any) => {
        totalObservers++;
        if (totalObservers === 1) {
            unsubscribe = subscribe();
        }
        const unsub = handler(listener);
        let unsubbed = false;
        return () => {
            if (!unsubbed) {
                unsubbed = true;
                totalObservers--;
                if (totalObservers === 0) {
                    unsubscribe?.();
                }
            }
            unsub?.();
        };
    };
    list.onUpdate = customListener(nativeOnUpdate);
    list.onInsert = customListener(nativeOnInsert);
    list.onDelete = customListener(nativeOnDelete);
    return () => totalObservers;
}

/**
 * Creates a reactive list that is filtered based on the specified list input.
 * @param list The reactive list to be filtered.
 * @param fn The function to filter the items.
 * @returns - A new reactive list that is filtered based on the specified list input.
 */
export function filter<T>(list: WatchableList<T>, fn: (item: T) => boolean): ObservedList<T> {
    let raw: T[] = [];
    let _f: boolean[] = [];
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
        const totalObservers = getTotalObserver();
        if (index === undefined) {
            if (totalObservers > 0) {
                return [...raw];
            } else {
                return list().filter(fn);
            }
        }
        if (totalObservers > 0) {
            return raw[index];
        } else {
            return list().filter(fn)[index];
        }
    };
    const trigger = watchify(FilteredList);
    const getTotalObserver = observy(FilteredList as ObservedList<T>, () => {
        raw = [];
        _f = list().map(fn);
        for (let i = 0; i < _f.length; i++) {
            if (_f[i]) {
                raw.push(list(i));
            }
        }
        return list.watch({
            update(index, value, prev) {
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
            },
            insert(index, value) {
                const allow = fn(value);
                _f.splice(index, 0, allow);
                if (allow) {
                    insertFiltered(index, value);
                }
            },
            delete(index, value) {
                if (_f[index]) {
                    deleteFiltered(index, value);
                }
                _f.splice(index, 1);
            }
        });
    });
    FilteredList.filter = (fn: (item: T) => boolean) => filter(FilteredList as WatchableList<T>, fn);
    FilteredList.map = <U>(fn: (item: T) => U) => map(FilteredList as WatchableList<T>, fn);
    FilteredList.sort = (fn?: (item: T, elem: T) => boolean) => sort(FilteredList as WatchableList<T>, fn);
    FilteredList.toString = () => `FilteredList [ ${(FilteredList() as T[]).join(', ')} ]`;
    return FilteredList as ObservedList<T>;
}

/**
 * Creates a reactive list that is mapped based on the specified list input.
 * @param list The reactive list to be mapped.
 * @param fn The function to map the items.
 * @returns A new reactive list that is mapped based on the specified list input.
 */
export function map<S, T>(list: WatchableList<S>, fn: (item: S) => T): ObservedList<T> {
    let raw: T[] = [];
    for (const item of list()) {
        raw.push(fn(item));
    }
    const MappedList = (index?: number) => {
        const totalObservers = getTotalObserver();
        if (index === undefined) {
            if (totalObservers) {
                return [...raw];
            } else {
                return list().map(fn);
            }
        }
        if (totalObservers) {
            return raw[index];
        } else {
            return list().map(fn)[index];
        }
    };
    const trigger = watchify(MappedList);
    const getTotalObserver = observy(MappedList as ObservedList<T>, () => {
        raw = [];
        for (const item of list()) {
            raw.push(fn(item));
        }
        return list.watch({
            update(index, value) {
                const mapped = fn(value);
                const before = raw[index];
                if (mapped !== before) {
                    raw[index] = mapped;
                    trigger('=', index, mapped, before);
                }
            },
            insert(index, value) {
                const mapped = fn(value);
                raw.splice(index, 0, mapped);
                trigger('+', index, mapped);
            },
            delete(index) {
                const value = raw[index];
                raw.splice(index, 1);
                trigger('-', index, value);
            }
        });
    });
    MappedList.filter = (fn: (item: T) => boolean) => filter(MappedList as WatchableList<T>, fn);
    MappedList.map = <U>(fn: (item: T) => U) => map(MappedList as WatchableList<T>, fn);
    MappedList.sort = (fn?: (item: T, elem: T) => boolean) => sort(MappedList as WatchableList<T>, fn);
    MappedList.toString = () => `MappedList [ ${(MappedList() as T[]).join(', ')} ]`;
    return MappedList as ObservedList<T>;
}

const asc = (item: any, elem: any) => item < elem;

/**
 * Creates a reactive list that is sorted based on the specified list input.
 *
 * @param list The reactive list to be sorted.
 * @param fn The function to sort the items.
 * @returns A new reactive list that is sorted based on the specified list input.
 */
export function sort<T>(list: WatchableList<T>, fn: (item: T, elem: T) => boolean = asc): ObservedList<T> {
    let raw: T[] = [];
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
    const SortedList = (index?: number) => {
        const totalObservers = getTotalObserver();
        if (index === undefined) {
            if (totalObservers) {
                return [...raw];
            } else {
                const arr: T[] = [];
                for (const item of list()) {
                    insertItem(arr, item);
                }
                return arr;
            }
        }
        if (totalObservers) {
            return raw[index];
        } else {
            const arr: T[] = [];
            for (const item of list()) {
                insertItem(arr, item);
            }
            return arr[index];
        }
    };
    const trigger = watchify(SortedList);
    const getTotalObserver = observy(SortedList as ObservedList<T>, () => {
        raw = [];
        for (const item of list()) {
            insertItem(raw, item);
        }
        return list.watch({
            update(_, value, prev) {
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
            },
            insert(_, value) {
                const insertIndex = insertItem(raw, value);
                trigger('+', insertIndex, value);
            },
            delete(_, value) {
                const index = raw.indexOf(value);
                if (index !== -1) {
                    raw.splice(index, 1);
                    trigger('-', index, value);
                }
            }
        });
    });
    SortedList.filter = (fn: (item: T) => boolean) => filter(SortedList as any as WatchableList<T>, fn);
    SortedList.map = <U>(fn: (item: T) => U) => map(SortedList as any as WatchableList<T>, fn);
    SortedList.sort = (fn?: (item: T, elem: T) => boolean) => sort(SortedList as any as WatchableList<T>, fn);
    SortedList.toString = () => `SortedList [ ${(SortedList() as T[]).join(', ')} ]`;
    return SortedList as ObservedList<T>;
}
