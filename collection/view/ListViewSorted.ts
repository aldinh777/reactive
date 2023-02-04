import { StateList } from '../StateList';
import { ListView } from './ListView';

export class ListViewSorted<T> extends ListView<T, T> {
    private _sort: (item: T, compare: T) => boolean;

    constructor(list: StateList<T>, sorter: (item: T, compare: T) => boolean) {
        super(list);
        this._sort = sorter;
        for (const item of list.raw) {
            this.insertItem(this.raw, item);
        }
        list.onUpdate((_, value, prev) => {
            const prevIndex = this.raw.indexOf(prev);
            if (prevIndex !== -1) {
                this.raw.splice(prevIndex, 1);
                const nextIndex = this.insertItem(this.raw, value);
                if (prevIndex === nextIndex) {
                    this.trigger('=', nextIndex, value, prev);
                } else {
                    this.trigger('-', prevIndex, prev);
                    this.trigger('+', nextIndex, value);
                }
            }
        });
        list.onInsert((_, value) => {
            const insertIndex = this.insertItem(this.raw, value);
            this.trigger('+', insertIndex, value);
        });
        list.onDelete((_, value) => {
            const index = this.raw.indexOf(value);
            if (index !== -1) {
                this.raw.splice(index, 1);
                this.trigger('-', index, value);
            }
        });
    }
    replaceSorter(sorter: (item: T, elem: T) => boolean) {
        this._sort = sorter;
        const sorted: T[] = [];
        for (const item of this._list.raw) {
            this.insertItem(sorted, item);
        }
        for (let i = 0; i < sorted.length; i++) {
            const item = sorted[i];
            const elem = this.raw[i];
            if (item !== elem) {
                const deleteIndex = this.raw.indexOf(item);
                const swap = this.raw[deleteIndex];
                this.raw.splice(deleteIndex, 1);
                this.trigger('-', deleteIndex, swap);
                this.raw.splice(i, 0, swap);
                this.trigger('+', i, swap);
            }
        }
    }
    private insertItem(array: T[], item: T): number {
        let insertIndex = array.length;
        for (let i = 0; i < array.length; i++) {
            const elem = array[i];
            if (this._sort(item, elem)) {
                insertIndex = i;
                break;
            }
        }
        array.splice(insertIndex, 0, item);
        return insertIndex;
    }
}
