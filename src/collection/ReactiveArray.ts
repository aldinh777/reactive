import { removeFromArray } from '../util';
import { Reactive, Unsubscriber } from '../Reactive';
import {
    Operation,
    parseReactive,
    ReactiveItem,
    ReactiveItemCallback,
    ReCollection,
    ReCollectionEvent,
    ReCollectionUpdater
} from './ReCollection';

export function reactifyArray<T>(items: ReactiveItem<T>[]) {
    return items.map(it => parseReactive(it));
}

export class ReactiveArray<T> implements ReCollection<T> {
    private __items: Reactive<T>[];
    private __insertListener: ReCollectionUpdater[] = [];
    private __deleteListener: ReCollectionUpdater[] = [];
    private __updateListener: ReCollectionUpdater[] = [];
    constructor(...items: T[]) {
        this.__items = reactifyArray(items);
    }
    get length() {
        return this.__items.length;
    }
    // Reactive Collection
    private __internalObjectify(mapper: WeakMap<ReactiveArray<T>, any>): any {
        if (mapper.has(this)) {
            return mapper.get(this);
        }
        const result: any[] = [];
        mapper.set(this, result);
        this.__items.forEach(r => {
            const rv = r.value;
            result.push(rv instanceof ReactiveArray ? rv.__internalObjectify(mapper) : rv);
        });
        return result;
    }
    triggerUpdate(operation: Operation, item: Reactive<T>, index?: number): boolean {
        let skip = false;
        const reCollectionEvent: ReCollectionEvent = {
            operation,
            index,
            item,
            cancel: () => { skip = true },
        };
        switch (operation) {
            case 'insert':
                for (const ins of this.__insertListener) {
                    ins(reCollectionEvent);
                    if (skip) {
                        return false;
                    }
                }
                return true;
            case 'delete':
                for (const del of this.__deleteListener) {
                    del(reCollectionEvent);
                    if (skip) {
                        return false;
                    }
                }
                return true;
            case 'update':
                for (const upd of this.__updateListener) {
                    upd(reCollectionEvent);
                    if (skip) {
                        return false;
                    }
                }
                return true;
            default:
                return false;
        }
    }
    at(index: any): Reactive<T> | undefined {
        return this.__items[index];
    }
    toObject(): any[] {
        return this.__internalObjectify(new WeakMap());
    }
    onInsert(callback: ReCollectionUpdater): Unsubscriber {
        this.__insertListener.push(callback);
        return () => removeFromArray(callback, this.__insertListener);
    }
    onDelete(callback: ReCollectionUpdater): Unsubscriber {
        this.__deleteListener.push(callback);
        return () => removeFromArray(callback, this.__deleteListener);
    }
    onUpdate(callback: ReCollectionUpdater): Unsubscriber {
        this.__updateListener.push(callback);
        return () => removeFromArray(callback, this.__updateListener);
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
    forEach(callback: ReactiveItemCallback<T>): void {
        this.__items.forEach((r, index) => callback(r.value, index));
    }
}
