import { Reactive, Unsubscriber } from '../Reactive';
import { removeFromArray } from '../util';

export type Operation = 'update' | 'insert' | 'delete';
export type ReactiveItem<T> = T | Reactive<T>;
export type ReactiveItemCallback<T> = (value: T, index: number | string) => void;
export type ReCollectionUpdater<T> = (ev: ReCollectionEvent<T>) => void;
export interface ReCollectionEvent<T> {
    operation: Operation;
    index?: number | string;
    item: Reactive<T>;
    cancel: () => void;
}

export function parseReactive<T>(item: ReactiveItem<T>): Reactive<T> {
    if (item instanceof Reactive) {
        return item;
    }
    return new Reactive(item);
}

export abstract class ReactiveCollection<T> {
    private __unsubscribers: WeakMap<Reactive<T>, Unsubscriber> = new WeakMap();
    private __insertListener: ReCollectionUpdater<T>[] = [];
    private __deleteListener: ReCollectionUpdater<T>[] = [];
    private __updateListener: ReCollectionUpdater<T>[] = [];
    protected abstract __internalObjectify(mapper: WeakMap<ReactiveCollection<T>, any>): any;
    protected abstract __includesReactive(item: Reactive<T>): boolean;
    abstract forEach(callback: ReactiveItemCallback<T>): void;
    abstract at(index: number | string): Reactive<T> | undefined;
    static objectify<T>(item: T, mapper: WeakMap<ReactiveCollection<T>, any>): any {
        return item instanceof ReactiveCollection ? item.__internalObjectify(mapper) : item;
    }
    triggerUpdate(operation: Operation, item: Reactive<T>, index?: number | string): boolean {
        let skip = false;
        const reCollectionEvent: ReCollectionEvent<T> = {
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
                if (!this.__unsubscribers.has(item)) {
                    const unsub = item.onChange((_, ev) => {
                        if (!this.triggerUpdate('update', item)) {
                            ev.cancel();
                        }
                    });
                    this.__unsubscribers.set(item, unsub);
                }
                return true;
            case 'delete':
                for (const del of this.__deleteListener) {
                    del(reCollectionEvent);
                    if (skip) {
                        return false;
                    }
                }
                if (this.__unsubscribers.has(item)) {
                    if (!this.__includesReactive(item)) {
                        const unsub = this.__unsubscribers.get(item);
                        if (unsub) {
                            unsub();
                            this.__unsubscribers.delete(item);
                        }
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
    onInsert(callback: ReCollectionUpdater<T>): Unsubscriber {
        this.__insertListener.push(callback);
        return () => removeFromArray(callback, this.__insertListener);
    }
    onDelete(callback: ReCollectionUpdater<T>): Unsubscriber {
        this.__deleteListener.push(callback);
        return () => removeFromArray(callback, this.__deleteListener);
    }
    onUpdate(callback: ReCollectionUpdater<T>): Unsubscriber {
        this.__updateListener.push(callback);
        return () => removeFromArray(callback, this.__updateListener);
    }
    toObject(): any {
        return this.__internalObjectify(new WeakMap());
    }
    toProxy(): this {
        const proxy = new Proxy(this, {
            get(target: any, p): any {
                const item = target.at(p as string);
                if (item) {
                    const result = item.value;
                    if (result instanceof ReactiveCollection) {
                        return result.toProxy();
                    }
                    return result;
                }
                return target[p];
            },
            set(target, p, value): boolean {
                const item = target.at(p as string);
                if (item) {
                    item.value = value;
                    return true;
                }
                return false;
            },
        });
        return proxy;
    }
}