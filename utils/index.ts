/**
 * @module
 * Common State utilities to handle state changes
 */

import type { State } from '../state/index.ts';
import type { Stoppable, Unsubscribe } from './subscription.ts';
import { __ROOT_SET, __EFFECTS_STACK, __DYNAMICS } from '../state/internal.ts';
import { state } from '../state/index.ts';

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
        const newDeps = filterDeps(__EFFECTS_STACK.pop());
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
