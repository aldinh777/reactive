import { createSubscription, Subscription } from '../helper/subscription-helper';

export type UpdateListener<T> = (value: T) => any;
export type ChangeHandler<T> = (next: T, previous: T) => any;
export type StateSubscription<T> = Subscription<State<T>, UpdateListener<T>>;

export class State<T> {
    private _upd: UpdateListener<T>[] = [];
    private _val: T;
    private _lock: boolean = false;
    private _next!: T;

    constructor(initial: T) {
        this._val = initial;
    }
    getValue(): T {
        return this._val;
    }
    setValue(value: T) {
        this._next = value;
        if (!this._lock) {
            this._next = value;
            do {
                const next = this._next;
                this._lock = true;
                this._val = next;
                for (const listener of this._upd) {
                    listener(next);
                    if (!this._lock) {
                        break;
                    }
                }
            } while (!this._lock);
        }
        this._lock = false;
    }
    addListener(listener: UpdateListener<T>): StateSubscription<T> {
        return createSubscription(this, listener, this._upd);
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
