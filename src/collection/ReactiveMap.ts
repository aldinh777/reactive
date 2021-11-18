import { Reactive } from '../Reactive';
import {
    ReactiveDecorator,
    parseReactive,
    ReactiveCollection,
    ReactiveItem,
    ReactiveItemCallback,
    RecollectionDecorator
} from './ReactiveCollection';

export class ReactiveMap<T> extends ReactiveCollection<T> {
    private __map: Map<string, Reactive<T>> = new Map();
    get size(): number {
        return this.__map.size;
    }
    // Reactive Collection
    protected __internalObjectify(
        mapper: WeakMap<ReactiveCollection<T>, any>,
        decor: ReactiveDecorator,
        selfDecor: RecollectionDecorator
    ): any {
        if (mapper.has(this)) {
            return mapper.get(this);
        }
        const result: any = {};
        mapper.set(this, result);
        this.__map.forEach((r, key) => result[key] = ReactiveCollection.objectify(r, mapper, decor, selfDecor));
        if (selfDecor) {
            return selfDecor(result, this);
        }
        return result;
    }
    protected __includesReactive(item: Reactive<T>): boolean {
        return Array.from(this.__map.values()).includes(item);
    }
    forEach(callback: ReactiveItemCallback<T>): void {
        if (this.__map) {
            this.__map.forEach((r, index) => callback(r.value, index, r));
        }
    }
    at(index: number | string): Reactive<T> | undefined {
        if (typeof index === 'number') {
            index = index.toString();
        }
        return this.__map.get(index);
    }
    // Map Implementation
    clear(): void {
        const backup = this.__map;
        this.__map = new Map();
        backup.forEach((r, key) => {
            if (!this.triggerUpdate('delete', r, key)) {
                this.__map.set(key, r);
            }
        });
    }
    delete(key: string): boolean {
        const item = this.__map.get(key);
        if (item) {
            this.__map.delete(key);
            if (!this.triggerUpdate('delete', item, key)) {
                this.__map.set(key, item);
                return false;
            }
            return true;
        }
        return false;
    }
    has(key: string): boolean {
        return this.__map.has(key);
    }
    set(key: string, value: ReactiveItem<T>): void {
        const item = parseReactive(value);
        if (this.triggerUpdate('insert', item, key)) {
            this.__map.set(key, item);
        }
    }
}
