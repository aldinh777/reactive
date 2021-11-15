import { Reactive, Unsubscriber } from '../Reactive';

export type Operation = 'update' | 'insert' | 'delete';
export type ReactiveItem<T> = T | Reactive<T>;
export type ReactiveItemCallback<T> = (value: T, index: number) => void;
export type ReCollectionUpdater = (ev: ReCollectionEvent) => void;
export interface ReCollectionEvent {
    operation: Operation;
    index?: number | string;
    item: Reactive<any>;
    cancel: () => void;
}
export interface ReCollection<T> {
    at(index: any): Reactive<T> | undefined;
    toObject(): any;
    onInsert(callback: ReCollectionUpdater): Unsubscriber;
    onDelete(callback: ReCollectionUpdater): Unsubscriber;
    onUpdate(callback: ReCollectionUpdater): Unsubscriber;
    triggerUpdate(operation: Operation, item: Reactive<T>, index?: number | string): boolean;
}

export function parseReactive<T>(item: ReactiveItem<T>): Reactive<T> {
    if (item instanceof Reactive) {
        return item;
    }
    return new Reactive(item);
}
