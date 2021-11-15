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
        const filtered: Reactive<T>[] = [];
        const reactified = reactifyArray(items);
        reactified.forEach(r => {
            const index = this.__items.length + filtered.length;
            if (this.triggerUpdate('insert', r, index)) {
                filtered.push(r);
            }
        });
        return this.__items.push(...filtered);
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
        let deleteResult: Reactive<T>[] = [];
        if (deleteCount) {
            const unsplice: Reactive<T>[] = [];
            const spliced = this.__items.splice(start, deleteCount);
            spliced.forEach((r, curIndex) => {
                const index = start + curIndex;
                if (this.triggerUpdate('delete', r, index)) {
                    deleteResult.push(r);
                } else {
                    unsplice.push(r);
                }
            });
            this.__items.splice(start, 0, ...unsplice);
        }
        if (items.length) {
            const filtered: Reactive<T>[] = [];
            const reactified = reactifyArray(items);
            reactified.forEach(r => {
                const index = start + filtered.length;
                if (this.triggerUpdate('insert', r, index)) {
                    filtered.push(r);
                }
            });
            this.__items.splice(start, 0, ...filtered);
        }
        return deleteResult;
    }
    unshift(...items: Reactive<T>[]): number {
        const filtered: Reactive<T>[] = [];
        const reactified = reactifyArray(items);
        reactified.forEach(r => {
            const index = filtered.length;
            if (this.triggerUpdate('insert', r, index)) {
                filtered.push(r);
            }
        });
        return this.__items.unshift(...filtered);
    }
}
