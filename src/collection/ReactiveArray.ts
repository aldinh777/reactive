import { Reactive } from '../Reactive';
import {
    parseReactive,
    ReactiveCollection,
    ReactiveItem,
    ReactiveItemCallback
} from './ReactiveCollection';

export class ReactiveArray<T> extends ReactiveCollection<T> {
    private __items: Reactive<T>[] = [];
    constructor(...items: T[]) {
        super();
        this.push(...items);
    }
    get size(): number {
        return this.__items.length;
    }
    // Reactive Collection
    protected __internalObjectify(mapper: WeakMap<ReactiveCollection<T>, any>): any {
        if (mapper.has(this)) {
            return mapper.get(this);
        }
        const result: any[] = [];
        mapper.set(this, result);
        this.__items.forEach(r => result.push(ReactiveCollection.objectify(r, mapper)));
        return result;
    }
    protected __includesReactive(item: Reactive<T>): boolean {
        return this.__items.includes(item);
    }
    forEach(callback: ReactiveItemCallback<T>): void {
        if (this.__items) {
            this.__items.forEach((r, index) => callback(r.value, index, r));
        }
    }
    at(index: number | string): Reactive<T> | undefined {
        if (typeof index === 'string') {
            index = parseInt(index);
        }
        return this.__items[index];
    }
    insert(index: number, value: ReactiveItem<T>): boolean {
        const item = parseReactive(value);
        const fixedIndex = index < 0 ? 0 : index > this.size ? this.size : index;
        if (fixedIndex !== this.size) {
            if (item === this.at(fixedIndex)) {
                return false;
            } else {
                if (this.triggerUpdate('insert', item, fixedIndex)) {
                    this.__items.splice(index, 0, item);
                    return true;
                }    
            }
        } else {
            if (this.triggerUpdate('insert', item, fixedIndex)) {
                this.__items.splice(index, 0, item);
                return true;
            }
        }
        return false;
    }
    delete(index: number): boolean {
        const [deleted] = this.__items.splice(index, 1);
        if (deleted) {
            if (this.triggerUpdate('delete', deleted, index)) {
                return true;
            } else {
                this.__items.splice(index, 0, deleted);
            }
        }
        return false;
    }
    // Array Implementation
    pop(): Reactive<T> | undefined {
        const index = this.size - 1;
        const item = this.at(index);
        if (item && this.delete(index)) {
            return item;
        }
    }
    push(...items: ReactiveItem<T>[]): number {
        this.splice(this.__items.length, 0, ...items);
        return this.__items.length;
    }
    shift(): Reactive<T> | undefined {
        const index = 0;
        const item = this.at(index);
        if (item && this.delete(index)) {
            return item;
        }
    }
    splice(start: number, deleteCount: number = 0, ...items: ReactiveItem<T>[]): Reactive<T>[] {
        const deleteResults: Reactive<T>[] = [];
        let targetIndex = start < 0 ? 0 : start;
        while (deleteCount > 0) {
            const item = this.at(targetIndex);
            if (item) {
                if (this.delete(targetIndex)) {
                    deleteResults.push(item);
                } else {
                    targetIndex++;
                }
            } else {
                break;
            }
            deleteCount--;
        }
        if (items.length) {
            items.forEach(item => {
                if (this.insert(targetIndex, item)) {
                    targetIndex++;
                }
            });
        }
        return deleteResults;
    }
    unshift(...items: ReactiveItem<T>[]): number {
        this.splice(0, 0, ...items);
        return this.__items.length;
    }
}
