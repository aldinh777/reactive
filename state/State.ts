import { createSubscription, Subscription } from '../util';

export type UpdateListener<T> = (value: T) => any;
export type ChangeHandler<T> = (next: T, previous: T) => any;
export type StateSubscription<T> = Subscription<State<T>, UpdateListener<T>>;

export class State<T> {
    private _listeners: UpdateListener<T>[] = [];
    private _val: T;

    constructor(initial: T) {
        this._val = initial;
    }
    getValue(): T {
        return this._val;
    }
    setValue(value: T) {
        this._val = value;
        for (const listener of this._listeners) {
            listener(value);
        }
    }
    addListener(listener: UpdateListener<T>): StateSubscription<T> {
        this._listeners.push(listener);
        return createSubscription(this, listener, this._listeners);
    }
    onChange(handler: ChangeHandler<T>): StateSubscription<T> {
        let oldValue = this.getValue();
        return this.addListener((value) => {
            if (value !== oldValue) {
                handler(value, oldValue);
                oldValue = value;
            }
        });
    }
}
