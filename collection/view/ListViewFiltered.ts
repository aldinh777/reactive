import { StateList } from '../StateList';
import { ListView } from './ListView';

export class ListViewFiltered<T> extends ListView<T, T> {
    private _f: boolean[] = [];
    private _filter: (item: T) => boolean;

    constructor(list: StateList<T>, filter: (item: T) => boolean) {
        super(list);
        this._filter = filter;
        this._f = list.raw.map(filter);
        for (let i = 0; i < list.raw.length; i++) {
            if (this._f[i]) {
                this.raw.push(list.raw[i]);
            }
        }
        list.onUpdate((index, value, prev) => {
            const allowAfter = this._filter(value);
            if (this._f[index] !== allowAfter) {
                this._f[index] = allowAfter;
                if (allowAfter) {
                    this.insertFiltered(index, value);
                } else {
                    this.deleteFiltered(index, value);
                }
            } else if (allowAfter) {
                this.updateFiltered(index, value, prev);
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
            if (this._f[index]) {
                this.deleteFiltered(index, value);
            }
            this._f.splice(index, 1);
        });
    }
    replaceFilter(filter: (item: T) => boolean): void {
        this._filter = filter;
        const next_f = this._list.raw.map(filter);
        let currentIndex = 0;
        for (let i = 0; i < next_f.length; i++) {
            const allowNext = next_f[i];
            if (this._f[i] !== allowNext) {
                if (allowNext) {
                    const inserted = this._list.raw[i];
                    this.raw.splice(currentIndex, 0, inserted);
                    this.trigger('+', currentIndex, inserted);
                    currentIndex++;
                } else {
                    const deleted = this.raw[currentIndex];
                    this.raw.splice(currentIndex, 1);
                    this.trigger('-', currentIndex, deleted);
                    currentIndex = currentIndex && currentIndex - 1;
                }
            } else if (allowNext) {
                currentIndex++;
            }
        }
        this._f = next_f;
    }
    private updateFiltered(index: number, value: T, prev: T): void {
        const fIndex = this.findFilteredIndex(index);
        this.raw[fIndex] = value;
        this.trigger('=', fIndex, value, prev);
    }
    private insertFiltered(index: number, value: T): void {
        const fIndex = this.findFilteredIndex(index);
        this.raw.splice(fIndex, 0, value);
        this.trigger('+', fIndex, value);
    }
    private deleteFiltered(index: number, value: T): void {
        const fIndex = this.findFilteredIndex(index);
        const prev = this.raw[fIndex];
        this.raw.splice(fIndex, 1);
        this.trigger('-', fIndex, prev);
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
