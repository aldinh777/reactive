import { StateList } from './StateList';

export class StateListFiltered<T> extends StateList<T> {
    private _f: boolean[] = [];
    constructor(list: StateList<T>, filter: (item: T) => boolean) {
        super([]);
        for (const item of list.raw) {
            const allow = filter(item);
            this._f.push(allow);
            if (allow) {
                this.raw.push(item);
            }
        }
        list.onInsert((index, value) => {
            const allow = filter(value);
            this._f.splice(index, 0, allow);
            if (allow) {
                this.insertFiltered(index, value);
            }
        });
        list.onUpdate((index, value, prev) => {
            const allow = filter(value);
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
        list.onDelete((index, value) => {
            const allow = this._f[index];
            if (allow) {
                this.deleteFiltered(index, value);
``            }
            this._f.splice(index, 1);
        });
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
