import { StateList } from '../StateList';
import { ListView } from './ListView';

export class ListViewMapped<S, T> extends ListView<S, T> {
    private _map: (item: S) => T;

    constructor(list: StateList<S>, mapper: (item: S) => T) {
        super(list.raw.map(mapper), list);
        this._map = mapper;
        list.onUpdate((index, value) => {
            const mapped = this._map(value);
            const prev = this.raw[index];
            this.raw[index] = mapped;
            this.trigger('set', index, mapped, prev);
        });
        list.onInsert((index, value) => {
            const mapped = this._map(value);
            this.raw.splice(index, 0, mapped);
            this.trigger('ins', index, mapped);
        });
        list.onDelete((index) => {
            const value = this.raw[index];
            this.raw.splice(index, 1);
            this.trigger('del', index, value);
        });
    }
    replaceMapper(mapper: (item: S) => T): void {
        this._map = mapper;
        for (let i = 0; i < this._list.raw.length; i++) {
            const item = this._list.raw[i];
            const prev = this.raw[i];
            const value = this._map(item);
            this.raw[i] = value;
            this.trigger('set', i, value, prev);
        }
    }
}
