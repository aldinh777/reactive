import { StateList } from '../StateList';
import { ListView } from './ListView';

export class ListViewMapped<S, T> extends ListView<S, T> {
    private _remap?: (item: S, elem: T) => void | T;
    private _om: WeakMap<object, T> = new WeakMap();
    private _map: (item: S) => T;

    constructor(list: StateList<S>, mapper: (item: S) => T, remap?: (item: S, elem: T) => void) {
        super(list);
        this._map = mapper;
        this._remap = remap;
        for (const item of list.raw) {
            this.raw.push(this.mapItem(item));
        }
        list.onUpdate((index, value, prev) => {
            const mapped = this.mapItem(value, prev === value);
            const before = this.raw[index];
            if (mapped !== before) {
                this.raw[index] = mapped;
                this.trigger('set', index, mapped, before);
            }
        });
        list.onInsert((index, value) => {
            const mapped = this.mapItem(value, false);
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
        this._om = new WeakMap();
        for (let i = 0; i < this._list.raw.length; i++) {
            const item = this._list.raw[i];
            const prev = this.raw[i];
            const value = this.mapItem(item);
            this.raw[i] = value;
            this.trigger('set', i, value, prev);
        }
    }
    private mapItem(item: S, replace: boolean = true): T {
        if (!(this._remap && typeof item === 'object')) {
            return this._map(item);
        }
        if (!replace && this._om.has(item)) {
            const elem = this._om.get(item);
            this._remap(item, elem);
            return elem;
        }
        const mapped = this._map(item);
        this._om.set(item, mapped);
        return mapped;
    }
}
