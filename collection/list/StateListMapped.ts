import { StateList } from '../StateList';

export class StateListMapped<S, T> extends StateList<T> {
    private _map: (item: S) => T;

    constructor(list: StateList<S>, mapper: (item: S) => T) {
        super(list.raw.map(mapper));
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
}
