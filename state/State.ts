import { pushNonExists, removeFromArray } from '../util';

export type UpdateListener<T> = (value: T) => any;
export type ChangeHandler<T> = (next: T, previous: T) => any;
export interface StateSubscription<T> {
    state: State<T>;
    listener: UpdateListener<T>;
    unsubscribe(): any;
    resubscribe(): any;
}

export class State<T> {
    private _listeners: UpdateListener<T>[] = [];
    private _currentValue: T;

    constructor(initial: T) {
        this._currentValue = initial;
    }
    getValue(): T {
        return this._currentValue;
    }
    setValue(value: T) {
        this._currentValue = value;
        for (const listener of this._listeners) {
            listener(value);
        }
    }
    addListener(listener: UpdateListener<T>): StateSubscription<T> {
        this._listeners.push(listener);
        return {
            state: this,
            listener: listener,
            unsubscribe: () => removeFromArray(listener, this._listeners),
            resubscribe: () => pushNonExists(listener, this._listeners)
        };
    }
    onChange(handler: ChangeHandler<T>): StateSubscription<T> {
        let oldValue = this.getValue();
        return this.addListener(value => {
            if (value !== oldValue) {
                handler(value, oldValue);
                oldValue = value;
            }
        });
    }
}
