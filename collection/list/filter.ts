import { watchify } from '../../helper/watchable';
import { WatchableList } from '../list';

interface RListFilter<T> extends WatchableList<T> {
    replaceFilter(filter: (item: T) => boolean): void;
}

export function filterlist<T>(list: WatchableList<T>, filter: (item: T) => boolean): RListFilter<T> {
    const raw: T[] = [];
    const _f: boolean[] = list().map(filter);
    for (let i = 0; i < _f.length; i++) {
        if (_f[i]) {
            raw.push(list(i));
        }
    }
    function updateFiltered(index: number, value: T, prev: T): void {
        const fIndex = findFilteredIndex(index);
        raw[fIndex] = value;
        trigger('=', fIndex, value, prev);
    }
    function insertFiltered(index: number, value: T): void {
        const fIndex = findFilteredIndex(index);
        raw.splice(fIndex, 0, value);
        trigger('+', fIndex, value);
    }
    function deleteFiltered(index: number, value: T): void {
        const fIndex = findFilteredIndex(index);
        const prev = raw[fIndex];
        raw.splice(fIndex, 1);
        trigger('-', fIndex, prev);
    }
    function findFilteredIndex(sourceIndex: number): number {
        let filteredIndex = 0;
        for (let i = 0; i < sourceIndex; i++) {
            if (_f[i]) {
                filteredIndex++;
            }
        }
        return filteredIndex;
    }
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
    });
    list.onInsert((index, value) => {
        const allow = filter(value);
        _f.splice(index, 0, allow);
        if (allow) {
            insertFiltered(index, value);
        }
    });
    list.onDelete((index, value) => {
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
    RListFilter.replaceFilter = (newFilter: (item: T) => boolean): void => {
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
    return RListFilter as RListFilter<T>;
}
