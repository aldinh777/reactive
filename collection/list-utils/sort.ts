import type { ObservedList, WatchableList } from '../list.js';
import { stopify, watchify } from '../../utils/watchable.js';

const defaultSorter = (item: any, elem: any) => item < elem;

export function sort<T>(list: WatchableList<T>, sorter: (item: T, elem: T) => boolean = defaultSorter) {
    const raw: T[] = [];
    const insertItem = (array: T[], item: T): number => {
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
    };
    for (const item of list()) {
        insertItem(raw, item);
    }
    const SortedList = (index?: number) => {
        if (index === undefined) {
            return raw;
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
    SortedList.toString = () => `SortedList [ ${raw.join(', ')} ]`;
    return SortedList as ObservedList<T>;
}
