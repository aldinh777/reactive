import type { Unsubscribe } from '../utils/subscription.js';
import { __EFFECT } from './internal.js';
import { subscribe } from '../utils/subscription.js';

export type UpdateListener<T> = (value: T) => any;
export type ChangeHandler<T> = (next: T, previous: T) => any;

export interface State<T = any> {
    (): T;
    (value: T): void;
    onChange(handler: ChangeHandler<T>): Unsubscribe;
}

export function state<T = any>(initial?: T): State<T> {
    /** List of active update listeners */
    const upd: UpdateListener<T>[] = [];
    /** The actual value being stored */
    let val: T = initial;
    /**
     *  Update Lock :   Prevent state from executing another listener
     *                  while it is currently executing listener to
     *                  prevent infinite recursion
     */
    let ulock = false;
    /**
     *  Handler Lock :  Prevent next listeners from being executed
     *                  and act as marker
     */
    let hlock = false;
    const State = (...arg: [T?]) => {
        if (!arg.length) {
            if (__EFFECT._tracking) {
                __EFFECT._dependencies.add(State);
            }
            return val;
        }
        val = arg[0];
        hlock = ulock;
        while (!ulock) {
            ulock = true;
            for (const listener of [...upd]) {
                listener(val);
                if (hlock) {
                    break;
                }
            }
            ulock = !hlock;
            hlock = false;
        }
        ulock = hlock;
    };
    State.onChange = (handler: ChangeHandler<T>) => {
        let oldValue = val;
        return subscribe(upd, (value: T) => {
            if (value !== oldValue) {
                handler(value, oldValue);
                oldValue = value;
            }
        });
    };
    State.toString = () => `State { value: ${val} }`;
    return State;
}
