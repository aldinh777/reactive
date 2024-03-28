import type { ObservedList, WatchableList } from '../list.js';
import { watchify } from '../../utils/watchable.js';

type RListFilter<T> = ObservedList<T, (item: T) => boolean>;

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
    const unsubUpdate = list.onUpdate((index, value, prev) => {
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
    });
    const unsubInsert = list.onInsert((index, value) => {
        const allow = filter(value);
        _f.splice(index, 0, allow);
        if (allow) {
            insertFiltered(index, value);
        }
    });
    const unsubDelete = list.onDelete((index, value) => {
        if (_f[index]) {
            deleteFiltered(index, value);
        }
        _f.splice(index, 1);
    });
    const RListFilter = (index?: number) => {
        if (index === undefined) {
            return raw;
        }
        return raw[index];
    };
    const trigger = watchify(RListFilter);
    RListFilter.replaceMutator = (newFilter: (item: T) => boolean): void => {
        filter = newFilter;
        const next_f = list().map(newFilter);
        let currentIndex = 0;
        for (let i = 0; i < next_f.length; i++) {
            const allowNext = next_f[i];
            if (_f[i] !== allowNext) {
                if (allowNext) {
                    const inserted = list(i);
                    raw.splice(currentIndex, 0, inserted);
                    trigger('+', currentIndex, inserted);
                    currentIndex++;
                } else {
                    const deleted = raw[currentIndex];
                    raw.splice(currentIndex, 1);
                    trigger('-', currentIndex, deleted);
                    currentIndex = currentIndex && currentIndex - 1;
                }
            } else if (allowNext) {
                currentIndex++;
            }
        }
        _f.length = 0;
        _f.push(...next_f);
    };
    RListFilter.stop = () => {
        unsubUpdate();
        unsubInsert();
        unsubDelete();
    };
    return RListFilter as RListFilter<T>;
}
