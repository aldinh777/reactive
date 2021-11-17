import { Reactive, Unsubscriber } from '../Reactive';
import { removeFromArray } from '../util';

export type Operation = 'update' | 'insert' | 'delete';
export type ReactiveItem<T> = T | Reactive<T>;
export type ReactiveItemCallback<T> = (value: T, index: number | string, r: Reactive<T>) => void;
export type ReCollectionUpdater<T> = (ev: ReCollectionEvent<T>) => void;
export type Injector<T> = (item: Reactive<T>) => Unsubscriber;
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
    private __unsubscribers: WeakMap<Reactive<T>, Unsubscriber[]> = new WeakMap();
    private __injectors: Injector<T>[] = [];
    private __triggerListener : ReCollectionUpdater<T>[] = [];
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
    constructor() {
        this.inject(item => item.onChange((_, ev) => {
            if (!this.triggerUpdate('update', item)) {
                ev.cancel();
            }
        }));
    }
    private __applyInjector(injector: Injector<T>, item: Reactive<T>): void {
        if (!this.__unsubscribers.has(item)) {
            this.__unsubscribers.set(item, []);
        }
        const unsubscibers = this.__unsubscribers.get(item);
        if (unsubscibers) {
            unsubscibers.push(injector(item));
        }
    }
    private __continueExecution(updater: ReCollectionUpdater<T>[], ev: ReCollectionEvent<T>): boolean {
        let skip = false;
        ev.cancel = () => skip = true;
        for (const upd of updater) {
            upd(ev);
            if (skip) {
                return false;
            }
        }
        return true;
    }
    private __cleanInjection(item: Reactive<T>) {
        if (this.__unsubscribers.has(item)) {
            if (!this.__includesReactive(item)) {
                const unsubcribers = this.__unsubscribers.get(item);
                if (unsubcribers) {
                    unsubcribers.forEach(unsub => unsub());
                }
                this.__unsubscribers.delete(item);
            }
        }
    }
    triggerUpdate(operation: Operation, item: Reactive<T>, index?: number | string): boolean {
        const reCollectionEvent: ReCollectionEvent<T> = {
            operation,
            index,
            item,
            cancel: () => {},
        };
        if (this.__continueExecution(this.__triggerListener, reCollectionEvent)) {
            switch (operation) {
                case 'insert':
                    if (this.__continueExecution(this.__insertListener, reCollectionEvent)) {
                        this.__injectors.forEach(injector => this.__applyInjector(injector, item));
                        return true;
                    }
                    return false;
                case 'delete':
                    if (this.__continueExecution(this.__deleteListener, reCollectionEvent)) {
                        this.__cleanInjection(item);
                        return true;
                    }
                    return false;
                case 'update':
                    if (this.__continueExecution(this.__updateListener, reCollectionEvent)) {
                        return true;
                    }
                    return false;
            }
        }
        return false;
    }
    inject(handler: Injector<T>) {
        this.forEach((_value, _index, r) => this.__applyInjector(handler, r));
        this.__injectors.push(handler);
    }
    onTrigger(callback: ReCollectionUpdater<T>): Unsubscriber {
        this.__triggerListener.push(callback);
        return () => removeFromArray(callback, this.__triggerListener);
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