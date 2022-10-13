import { StateList } from './StateList';

export class StateListMapped<S, T> extends StateList<T> {
    constructor(list: StateList<S>, mapper: (item: S) => T) {
        super(list.raw.map(mapper));
        list.onInsert((index, value) => {
            const mapped = mapper(value);
            this.raw.splice(index, 0, mapped);
            this.trigger('ins', index, mapped);
        });
        list.onUpdate((index, value) => {
            const mapped = mapper(value);
            const prev = this.raw[index];
            this.raw[index] = mapped;
            this.trigger('set', index, mapped, prev);
        });
        list.onDelete((index) => {
            const value = this.raw[index];
            this.raw.splice(index, 1);
            this.trigger('del', index, value);
        });
    }
}
