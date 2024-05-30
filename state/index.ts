import type { Unsubscribe } from '../utils/subscription.js';
import { __EFFECTS_STACK } from './internal.js';
import { subscribe } from '../utils/subscription.js';

type UpdateListener<T> = (value: T) => any;
type ChangeHandler<T> = (next: T, previous: T) => any;

/**
 * A reactive state interface that provides methods to get, set, and listen to state changes.
 */
export interface State<T = any> {
    /**
     * Retrieves the current state value.
     */
    (): T;
    /**
     * Updates the state with a new value.
     */
    (value: T): void;
    /**
     * Registers a handler that will be called whenever the state changes.
     */
    onChange(handler: ChangeHandler<T>, isLast?: boolean): Unsubscribe;
}

/**
 * function to create and initialize state
 */
export function state<T = any>(initial?: T): State<T> {
    /** List of active update listeners */
    const upd: Set<UpdateListener<T>> = new Set();
    /** Listeners that will be executed last */
    const updl: Set<UpdateListener<T>> = new Set();
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
            if (__EFFECTS_STACK.length) {
                __EFFECTS_STACK[__EFFECTS_STACK.length - 1].add(State);
            }
            return val;
        }
        val = arg[0];
        hlock = ulock;
        while (!ulock) {
            ulock = true;
            for (const listener of [...upd, ...updl]) {
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
    State.onChange = (handler: ChangeHandler<T>, isLast = false) => {
        let oldValue = val;
        return subscribe(isLast ? updl : upd, (value: T) => {
            if (value !== oldValue) {
                handler(value, oldValue);
                oldValue = value;
            }
        });
    };
    State.toString = () => `State { value: ${val} }`;
    return State;
}
