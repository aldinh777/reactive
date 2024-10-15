/**
 * @module
 * Base module that exposes definition and function to create State
 */

import type { Unsubscribe } from '../utils/subscription.ts';
import { __EFFECTS_STACK } from './internal.ts';
import { subscribe } from '../utils/subscription.ts';

/**
 * A reactive state interface that provides methods to get, set, and listen to value changes.
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
     * @param handler The function to be called when the state changes.
     * @param isLast If true, the handler will be called last after all other handlers have been called.
     * @returns An unsubscribe function to remove the handler from the list of active handlers.
     */
    onChange(handler: (next: T, previous: T) => any, isLast?: boolean): Unsubscribe;
}

/**
 * Creates and initializes a state.
 * @param initial The initial value of the state.
 * @returns The reactive state.
 */
export function state<T = any>(initial?: T): State<T> {
    /** List of active update listeners */
    const upd: Set<(value: T) => any> = new Set();
    /** Listeners that will be executed last */
    const updl: Set<(value: T) => any> = new Set();
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
    State.onChange = (handler: (next: T, previous: T) => any, isLast = false) => {
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
