/**
 * @module
 * Base module that exposes definition and function to create State
 */

import type { Unsubscribe, Stoppable } from '../common/subscription.ts';
import { subscribe } from '../common/subscription.ts';

/**
 * ====================================================================================================
 *    Internal module containing shared variables and functions to manage dependencies and effects.
 * ====================================================================================================
 */

/**
 * A WeakMap that maps each state to its root dependencies. This is used
 * to prevent any state from having duplicate dependencies or parent
 * dependencies.
 */
const __ROOT_SET: WeakMap<State, Map<State, Unsubscribe>> = new WeakMap();

/**
 * A WeakSet that stores all states created using the `computed` function.
 */
const __DYNAMICS: WeakSet<State> = new WeakSet();

/**
 * An array of Sets that stores the dependencies of each stack of effects.
 */
const __EFFECTS_STACK: Set<State>[] = [];

/**
 * ====================================================================================================
 *                                               State
 * ====================================================================================================
 */

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
    let val: T = initial as T;
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
        val = arg[0]!;
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
    return State as State<T>;
}

/**
 * ====================================================================================================
 *                                      Computed and Effects
 * ===================================================================================================
 */

/**
 * A reactive interface derived from State and Stoppable
 */
export interface Computed<T = any> extends State<T>, Stoppable {}

/**
 * Filters a set of states, if there is any stored dependencies from the state, use those
 * dependencies instead, if there is none, then use the state
 */
function filterDeps(states: Set<State>): Set<State> {
    const deps = new Set<State>();
    for (const dep of states) {
        if (__ROOT_SET.has(dep)) {
            const rootSet = __ROOT_SET.get(dep)!;
            for (const [root] of rootSet) {
                deps.add(root);
            }
        } else {
            deps.add(dep);
        }
    }
    return deps;
}

/**
 * Handles the execution of an effect handler and manages dependencies.
 *
 * @param effectHandler - The effect handler function to be executed.
 * @param state - The state to be updated with the result of the effect handler.
 * @returns An unsubscribe function to stop the effect.
 */
function handleEffect<T>(effectHandler: () => T, state?: Computed<T>): Unsubscribe {
    const rootDepsMap = new Map<State, Unsubscribe>();
    if (state) {
        __DYNAMICS.add(state);
        __ROOT_SET.set(state, rootDepsMap);
    }
    const exec = () => {
        __EFFECTS_STACK.push(new Set());
        const result = effectHandler();
        const newDeps = filterDeps(__EFFECTS_STACK.pop()!);
        for (const [oldDep, unsub] of rootDepsMap) {
            unsub();
            if (newDeps.has(oldDep)) {
                newDeps.delete(oldDep);
                rootDepsMap.set(oldDep, oldDep.onChange(exec));
            } else {
                rootDepsMap.delete(oldDep);
            }
        }
        for (const newDep of newDeps) {
            rootDepsMap.set(newDep, newDep.onChange(exec));
        }
        state?.(result);
    };
    exec();
    return () => {
        for (const unsub of rootDepsMap.values()) {
            unsub();
        }
        if (state) {
            __DYNAMICS.delete(state);
            __ROOT_SET.delete(state);
        }
    };
}

/**
 * Handles the execution of a handler with fixed dependencies.
 *
 * @param states - The states to be used as dependencies.
 * @param handler - The handler function to be executed.
 * @param state - The state to be updated with the result of the handler.
 * @returns An unsubscribe function to stop the effect.
 */
function handleFixed<T, U>(states: State<T>[], handler: (...args: T[]) => U, state?: Computed<U>): Unsubscribe {
    if (states.some((st) => __DYNAMICS.has(st))) {
        return handleEffect(() => handler(...states.map((s) => s())), state);
    }
    const rootDepsMap = new Map<State, Unsubscribe>();
    if (state) {
        __ROOT_SET.set(state, rootDepsMap);
    }
    const deps = filterDeps(new Set(states));
    const exec = () => {
        const result = handler(...states.map((s) => s()));
        state?.(result);
    };
    for (const dep of deps) {
        rootDepsMap.set(dep, dep.onChange(exec));
    }
    exec();
    return () => {
        for (const unsub of rootDepsMap.values()) {
            unsub();
        }
        if (state) {
            __ROOT_SET.delete(state);
        }
    };
}

/**
 * Magic type that allows effect arguments to be sync with the value of input dependencies
 */
type Dependencies<T extends any[]> = { [K in keyof T]: State<T[K]> };

/**
 * Sets an effect to be executed with the specified dependencies.
 *
 * @param effect - The effect handler function to be executed.
 * @param states - The states to be used as dependencies.
 * @returns An unsubscribe function to stop the effect.
 */
export const setEffect = <T extends any[]>(effect: (...args: T) => any, states?: Dependencies<T>): Unsubscribe =>
    states instanceof Array ? handleFixed(states, effect) : handleEffect(effect);

/**
 * Creates a computed state based on an effect and its dependencies.
 *
 * @param effect - The effect handler function to be executed.
 * @param states - The states to be used as dependencies.
 * @returns A computed state that will be updated with the result of the effect.
 */
export const computed = <T extends any[], U>(effect: (...args: T) => U, states?: Dependencies<T>): Computed<U> => {
    const computed = state() as Computed<U>;
    computed.stop = states instanceof Array ? handleFixed(states, effect, computed) : handleEffect(effect, computed);
    return computed;
};
