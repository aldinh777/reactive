import { removeFromArray } from './util';

export type UpdateListener<T> = (value: T) => any;
export interface ReactiveSubscription<T> {
    reactive: Reactive<T>
    listener: UpdateListener<T>
    unsubscribe: () => any
}

export class Reactive<T> {
    private __listeners: UpdateListener<T>[] = [];
    private __currentValue: T;

    constructor(initial: T) {
            this.__currentValue = initial;
    }
    get value(): T {
        return this.__currentValue;
    }
    set value(value: T) {
        this.__currentValue = value;
        this.__listeners.forEach(l => l(value));
    }
    addListener(listener: UpdateListener<T>): ReactiveSubscription<T> {
        this.__listeners.push(listener);
        return {
            reactive: this,
            listener: listener,
            unsubscribe: () => removeFromArray(listener, this.__listeners),
        };
    }
}
