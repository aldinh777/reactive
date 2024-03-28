import type { ObservedList, WatchableList } from '../list.js';
import { stopify, watchify } from '../../utils/watchable.js';

export function filterlist<T>(list: WatchableList<T>, filter: (item: T) => boolean) {
    const raw: T[] = [];
    const _f: boolean[] = list().map(filter);
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
            return raw;
        }
        return raw[index];
    };
    const trigger = watchify(FilteredList);
    FilteredList.stop = stopify([
        list.onUpdate((index, value, prev) => {
            const allowAfter = filter(value);
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
            const allow = filter(value);
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
    return FilteredList as ObservedList<T>;
}
