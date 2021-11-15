import { Reactive } from '../Reactive';
import {
    parseReactive,
    ReactiveCollection,
    ReactiveItem,
    ReactiveItemCallback
} from './ReactiveCollection';

export function reactifyArray<T>(items: ReactiveItem<T>[]) {
    return items.map(it => parseReactive(it));
}

export class ReactiveArray<T> extends ReactiveCollection<T> {
    private __items: Reactive<T>[] = [];
    constructor(...items: T[]) {
        super();
        this.push(...items);
    }
    get length() {
        return this.__items.length;
    }
    // Reactive Collection
    protected __internalObjectify(mapper: WeakMap<ReactiveCollection<T>, any>): any {
        if (mapper.has(this)) {
            return mapper.get(this);
        }
        const result: any[] = [];
        mapper.set(this, result);
        this.__items.forEach(r => {
            const item = r.value;
            result.push(ReactiveCollection.objectify(item, mapper));
        });
        return result;
    }
    protected __includesReactive(item: Reactive<T>): boolean {
        return this.__items.includes(item);
    }
    forEach(callback: ReactiveItemCallback<T>): void {
        this.__items.forEach((r, index) => callback(r.value, index));
    }
    at(index: any): Reactive<T> | undefined {
        return this.__items[index];
    }
    toObject(): any[] {
        return this.__internalObjectify(new WeakMap());
    }
    // Array Implementation
    pop(): Reactive<T> | undefined {
        const popped = this.__items.pop();
        if (popped) {
            if (this.triggerUpdate('delete', popped, this.__items.length)) {
                return popped;
            } else {
                this.__items.push(popped);
            }
        }
    }
    push(...items: ReactiveItem<T>[]): number {
        this.splice(this.__items.length, 0, ...items);
        return this.__items.length;
    }
    shift(): Reactive<T> | undefined {
        const shifted = this.__items.shift();
        if (shifted) {
            if (this.triggerUpdate('delete', shifted, 0)) {
                return shifted;
            } else {
                this.__items.unshift(shifted);
            }
        }
    }
    splice(start: number, deleteCount: number = 0, ...items: ReactiveItem<T>[]): Reactive<T>[] {
        const deleteResult: Reactive<T>[] = [];
        const unspliced: Reactive<T>[] = [];
        if (deleteCount) {
            const spliced = this.__items.splice(start, deleteCount);
            spliced.forEach((r, curIndex) => {
                const index = start + curIndex;
                if (this.triggerUpdate('delete', r, index)) {
                    deleteResult.push(r);
                } else {
                    const deleteIndex = start + unspliced.length;
                    this.__items.splice(deleteIndex, 0, r);
                    unspliced.push(r);
                }
            });
        }
        if (items.length) {
            const filtered: Reactive<T>[] = [];
            const reactified = reactifyArray(items);
            reactified.forEach(r => {
                const index = start + filtered.length + unspliced.length;
                if (this.triggerUpdate('insert', r, index)) {
                    this.__items.splice(index, 0, r);
                    filtered.push(r);
                }
            });
        }
        return deleteResult;
    }
    unshift(...items: ReactiveItem<T>[]): number {
        this.splice(0, 0, ...items);
        return this.__items.length;
    }
}
