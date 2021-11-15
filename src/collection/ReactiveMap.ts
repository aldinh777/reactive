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
        this.__map.forEach((r, key) => {
            const item = r.value;
            result[key] = ReactiveCollection.objectify(item, mapper);
        });
        return result;
    }
    forEach(callback: ReactiveItemCallback<T>): void {
        this.__map.forEach((r, index) => callback(r.value, index));
    }
    at(index: string): Reactive<T> | undefined {
        return this.__map.get(index);
    }
    // Map Implementation
    clear(): void {
        const deleted: string[] = [];
        this.__map.forEach((r, key) => {
            if (this.triggerUpdate('delete', r, key)) {
                deleted.push(key);
            }
        });
        deleted.forEach(key => this.__map.delete(key));
    }
    delete(key: string): boolean {
        const item = this.__map.get(key);
        if (item && this.triggerUpdate('delete', item, key)) {
            return this.__map.delete(key);
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
