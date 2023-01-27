import { createSubscription, Subscription } from '../helper/subscription-helper';

export type UpdateListener<T> = (value: T) => any;
export type ChangeHandler<T> = (next: T, previous: T) => any;
export type StateSubscription<T> = Subscription<State<T>, UpdateListener<T>>;

export class State<T> {
    /** List of active update listeners */
    private _upd: UpdateListener<T>[] = [];
    /** The actual value being stored */
    private _val: T;
    /**
     *  Update Lock :   Prevent state from executing another listener
     *                  while it is currently executing listener to
     *                  prevent infinite recursion
     */
    private _ulock: boolean = false;
    /**
     *  Handler Lock :  Prevent next listeners from being executed
     *                  and as a marker
     */
    private _hlock: boolean = false;

    constructor(initial: T) {
        this._val = initial;
    }
    getValue(): T {
        return this._val;
    }
    setValue(value: T) {
        this._val = value;
        this._hlock = this._ulock;
        while (!this._ulock) {
            this._ulock = true;
            for (const listener of this._upd) {
                listener(this._val);
                if (this._hlock) {
                    break;
                }
            }
            this._ulock = !this._hlock;
            this._hlock = false;
        }
        this._ulock = this._hlock;
    }
    /** Add listener to be called when the value are updated */
    addListener(listener: UpdateListener<T>): StateSubscription<T> {
        return createSubscription(this, listener, this._upd);
    }
    /** Add listener to be called only when the value are changed */
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
