import { StateList } from '../StateList';

export class StateListSorted<T> extends StateList<T> {
    private _sort: (item: T, compare: T) => boolean;
    
    constructor(list: StateList<T>, sorter?: (item: T, compare: T) => boolean) {
        super([]);
        this._sort = sorter || ((item, compare) => item < compare);
        for (const item of list.raw) {
            this.insertItem(item);
        }
        list.onUpdate((_, value, prev) => {
            const prevIndex = this.raw.indexOf(prev);
            if (prevIndex !== -1) {
                this.raw.splice(prevIndex, 1);
                const nextIndex = this.insertItem(value);
                if (prevIndex === nextIndex) {
                    this.trigger('set', nextIndex, value, prev);
                } else {
                    this.trigger('del', prevIndex, prev);
                    this.trigger('ins', nextIndex, value);
                }
            }
        });
        list.onInsert((_, value) => {
            const index = this.insertItem(value);
            this.trigger('ins', index, value);
        });
        list.onDelete((_, value) => {
            const index = this.raw.indexOf(value);
            if (index !== -1) {
                this.raw.splice(index, 1);
                this.trigger('del', index, value);
            }
        });
    }
    private insertItem(item: T): number {
        let insertIndex = this.raw.length;
        for (let i = 0; i < this.raw.length; i++) {
            const elem = this.raw[i];
            if (this._sort(item, elem)) {
                insertIndex = i;
                break;
            }
        }
        this.raw.splice(insertIndex, 0, item);
        return insertIndex;
    }
}
