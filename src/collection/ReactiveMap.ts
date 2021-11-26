import { Reactive } from '../Reactive';
import {
    parseReactive,
    ReactiveCollection,
    ReactiveItem,
    ReactiveItemCallback
} from './ReactiveCollection';

export class ReactiveMap<T> extends ReactiveCollection<T> {
    private __map: Map<string, Reactive<T>> = new Map();
    get size(): number {
        return this.__map.size;
    }
    // Reactive Collection
    protected __internalObjectify(mapper: WeakMap<ReactiveCollection<T>, any>): any {
        if (mapper.has(this)) {
            return mapper.get(this);
        }
        const result: any = {};
        mapper.set(this, result);
        this.__map.forEach((r, key) => result[key] = ReactiveCollection.objectify(r, mapper));
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
    insert(key: string, value: ReactiveItem<T>): boolean {
        const item = parseReactive(value);
        if (this.triggerUpdate('insert', item, key)) {
            this.__map.set(key, item);
            return true;
        }
        return false;
    }
    delete(key: string): boolean {
        const item = this.at(key);
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
    // Map Implementation
    set(key: string, value: ReactiveItem<T>): boolean {
        const item = this.at(key);
        if (item && !(value instanceof Reactive)) {
            item.value = value;
            return true;
        }
        return this.insert(key, value);
    }
    clear(): void {
        for (const key of Array.from(this.__map.keys())) {
            this.delete(key);
        }
    }
    has(key: string): boolean {
        return this.__map.has(key);
    }
}
