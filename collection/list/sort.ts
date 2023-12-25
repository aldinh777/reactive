import { watchify } from '../../helper/collection';
import { WatchableList } from '../list';

interface RListSort<T> extends WatchableList<T> {
    replaceSorter(sorter: (item: T, compare: T) => boolean): void;
}

export function sortlist<T>(list: WatchableList<T>, sorter: (item: T, compare: T) => boolean) {
    const raw: T[] = [];
    function insertItem(array: T[], item: T): number {
        let insertIndex = array.length;
        for (let i = 0; i < array.length; i++) {
            const elem = array[i];
            if (sorter(item, elem)) {
                insertIndex = i;
                break;
            }
        }
        array.splice(insertIndex, 0, item);
        return insertIndex;
    }
    for (const item of list()) {
        insertItem(raw, item);
    }
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
    });
    list.onInsert((_, value) => {
        const insertIndex = insertItem(raw, value);
        trigger('+', insertIndex, value);
    });
    list.onDelete((_, value) => {
        const index = raw.indexOf(value);
        if (index !== -1) {
            raw.splice(index, 1);
            trigger('-', index, value);
        }
    });
    const RListSort = (index?: number) => {
        if (index === undefined) {
            return raw;
        }
        return raw[index];
    };
    const trigger = watchify(RListSort);
    RListSort.replaceSorter = (sort: (item: T, elem: T) => boolean) => {
        sorter = sort;
        const sorted: T[] = [];
        for (const item of list()) {
            insertItem(sorted, item);
        }
        for (let i = 0; i < sorted.length; i++) {
            const item = sorted[i];
            const elem = raw[i];
            if (item !== elem) {
                const deleteIndex = raw.indexOf(item);
                const swap = raw[deleteIndex];
                raw.splice(deleteIndex, 1);
                trigger('-', deleteIndex, swap);
                raw.splice(i, 0, swap);
                trigger('+', i, swap);
            }
        }
    };
    return RListSort as RListSort<T>;
}
