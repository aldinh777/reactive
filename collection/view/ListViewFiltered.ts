import { StateList } from '../StateList';
import { ListView } from './ListView';

export class ListViewFiltered<T> extends ListView<T, T> {
    private _f: boolean[] = [];
    private _filter: (item: T) => boolean;

    constructor(list: StateList<T>, filter: (item: T) => boolean) {
        super([], list);
        this._filter = filter;
        for (const item of list.raw) {
            const allow = filter(item);
            this._f.push(allow);
            if (allow) {
                this.raw.push(item);
            }
        }
        list.onUpdate((index, value, prev) => {
            const allow = this._filter(value);
            if (this._f[index]) {
                if (allow) {
                    this.updateFiltered(index, value, prev);
                } else {
                    this._f[index] = false;
                    this.deleteFiltered(index, value);
                }
            } else if (allow) {
                this._f[index] = true;
                this.insertFiltered(index, value);
            }
        });
        list.onInsert((index, value) => {
            const allow = this._filter(value);
            this._f.splice(index, 0, allow);
            if (allow) {
                this.insertFiltered(index, value);
            }
        });
        list.onDelete((index, value) => {
            const allow = this._f[index];
            if (allow) {
                this.deleteFiltered(index, value);
            }
            this._f.splice(index, 1);
        });
    }
    replaceFilter(filter: (item: T) => boolean): void {
        this._filter = filter;
        const f = this._list.raw.map(filter);
        let currentIndex = 0;
        for (let i = 0; i < f.length; i++) {
            const prevAllow = this._f[i];
            const nextAllow = f[i];
            if (prevAllow) {
                if (nextAllow) {
                    currentIndex++;
                } else {
                    const deleted = this.raw[currentIndex];
                    this.raw.splice(currentIndex, 1);
                    this.trigger('del', currentIndex, deleted);
                    currentIndex = currentIndex && currentIndex - 1;
                }
            } else if (nextAllow) {
                const inserted = this._list.raw[i];
                this.raw.splice(currentIndex, 0, inserted);
                this.trigger('ins', currentIndex, inserted);
                currentIndex++;
            }
        }
        this._f = f;
    }
    private updateFiltered(index: number, value: T, prev: T): void {
        const fIndex = this.findFilteredIndex(index);
        this.raw[fIndex] = value;
        this.trigger('set', fIndex, value, prev);
    }
    private insertFiltered(index: number, value: T): void {
        const fIndex = this.findFilteredIndex(index);
        this.raw.splice(fIndex, 0, value);
        this.trigger('ins', fIndex, value);
    }
    private deleteFiltered(index: number, value: T): void {
        const fIndex = this.findFilteredIndex(index);
        const prev = this.raw[fIndex];
        this.raw.splice(fIndex, 1);
        this.trigger('del', fIndex, prev);
    }
    private findFilteredIndex(sourceIndex: number): number {
        let filteredIndex = 0;
        for (let i = 0; i < sourceIndex; i++) {
            if (this._f[i]) {
                filteredIndex++;
            }
        }
        return filteredIndex;
    }
}
