/**
 * @module
 * Base module that exposes definition and function to create State
 */

/**
 * ====================================================================================================
 *    Internal module containing shared variables and functions to manage dependencies and effects.
 * ====================================================================================================
 */

/**
 * Placeholder symbol for default value of state. used to differentiate states with value `undefined`.
 */
const EMPTY = Symbol('empty');

/**
 * A WeakMap that maps each state to its root dependencies. This is used
 * to prevent any state from having duplicate dependencies or parent
 * dependencies.
 */
const ROOT_SET: WeakMap<State, Map<State, (() => void) | undefined>> = new WeakMap();

/**
 * A WeakSet that stores all states created using the `computed` function.
 */
const DYNAMICS: WeakSet<State> = new WeakSet();

/**
 * An array of Sets that stores the dependencies of each stack of effects.
 */
const EFFECTS_STACK: Set<State>[] = [];

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
    getValue(): T;
    /**
     * Registers a handler that will be called whenever the state changes.
     * @param handler The function to be called when the state changes.
     * @param isLast If true, the handler will be called last after all other handlers have been called.
     * @returns An unsubscribe function to remove the handler from the list of active handlers.
     */
    onChange(handler: (next: T, previous: T) => any, isLast?: boolean): () => void;
}

function subscribe<L>(set: Set<L>, listener: L): () => void {
    set.add(listener);
    return () => set.delete(listener);
}

/**
 * Creates and initializes a state.
 *
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
    const State = (next: T | typeof EMPTY = EMPTY) => {
        if (next === EMPTY) {
            if (EFFECTS_STACK.length) {
                EFFECTS_STACK[EFFECTS_STACK.length - 1].add(State);
            }
            return State.getValue();
        }
        val = next;
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
    State.getValue = () => val;
    State.onChange = (handler: (next: T, previous: T) => any, isLast = false) => {
        let oldValue = val;
        return subscribe(isLast ? updl : upd, (value: T) => {
            if (value !== oldValue) {
                handler(value, oldValue);
                oldValue = value;
            }
        });
    };
    return State as State<T>;
}

/**
 * ====================================================================================================
 *                                      Computed and Effects
 * ===================================================================================================
 */

/**
 * Filters a set of states, if there is any stored dependencies from the state, use those
 * dependencies instead, if there is none, then use the state
 */
function filterDeps(states: Set<State>): Set<State> {
    const deps = new Set<State>();
    for (const dep of states) {
        if (ROOT_SET.has(dep)) {
            const rootSet = ROOT_SET.get(dep)!;
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
 * @param effectHandler The effect handler function to be executed.
 * @param state The state to be updated with the result of the effect handler.
 * @returns An unsubscribe function to stop the effect.
 */
function handleEffect<T>(effectHandler: () => T, state?: State<T>): () => void {
    const rootDepsMap = new Map<State, () => void>();
    let totalObservers = 0;
    const exec = () => {
        if (!state) {
            updateDependencies();
        } else if (totalObservers > 0) {
            state(updateDependencies());
        }
    };
    const unsubscribe = () => {
        for (const unsub of rootDepsMap.values()) {
            unsub();
        }
        rootDepsMap.clear();
        if (state) {
            ROOT_SET.delete(state);
        }
    };
    const updateDependencies = () => {
        EFFECTS_STACK.push(new Set());
        const result = effectHandler();
        const deps = EFFECTS_STACK.pop()!;
        for (const newDep of deps) {
            if (rootDepsMap.has(newDep)) {
                const unsub = rootDepsMap.get(newDep);
                unsub?.();
            }
            rootDepsMap.set(newDep, newDep.onChange(exec));
        }
        const rootDeps = filterDeps(deps);
        for (const [oldDep, unsub] of rootDepsMap) {
            if (!rootDeps.has(oldDep)) {
                unsub();
                rootDepsMap.delete(oldDep);
            }
        }
        for (const newDep of rootDeps) {
            if (!rootDepsMap.has(newDep)) {
                rootDepsMap.set(newDep, newDep.onChange(exec));
            }
        }
        return result;
    };
    if (state) {
        DYNAMICS.add(state);
        const nativeGetValue = state.getValue;
        const nativeOnChange = state.onChange;
        state.getValue = () => (totalObservers > 0 ? nativeGetValue() : effectHandler());
        state.onChange = (handler: (next: T, previous: T) => any, isLast?: boolean) => {
            totalObservers++;
            if (totalObservers === 1) {
                ROOT_SET.set(state, rootDepsMap);
                exec();
            }
            const unsub = nativeOnChange(handler, isLast);
            let unsubbed = false;
            return () => {
                if (!unsubbed) {
                    unsubbed = true;
                    totalObservers--;
                    if (totalObservers === 0) {
                        unsubscribe();
                    }
                }
                unsub();
            };
        };
    }
    exec();
    return unsubscribe;
}

/**
 * Handles the execution of a handler with fixed dependencies.
 *
 * @param states - The states to be used as dependencies.
 * @param effectHandler - The handler function to be executed.
 * @param state - The state to be updated with the result of the handler.
 * @returns An unsubscribe function to stop the effect.
 */
function handleFixed<T, U>(states: State<T>[], effectHandler: (...args: T[]) => U, state?: State<U>): () => void {
    const executeEffect = () => effectHandler(...states.map((s) => s()));
    if (states.some((st) => DYNAMICS.has(st))) {
        return handleEffect(executeEffect, state);
    }
    const rootDepsMap = new Map<State, (() => void) | undefined>();
    const rootDeps = filterDeps(new Set(states));
    for (const dep of rootDeps) {
        rootDepsMap.set(dep, undefined);
    }
    let totalObservers = 0;
    const exec = () => {
        if (!state) {
            executeEffect();
        } else if (totalObservers > 0) {
            state(executeEffect());
        }
    };
    const unsubscribe = () => {
        for (const unsub of rootDepsMap.values()) {
            unsub?.();
        }
    };
    const subscribe = () => {
        for (const dep of rootDeps) {
            rootDepsMap.set(dep, dep.onChange(exec));
        }
    };
    if (state) {
        ROOT_SET.set(state, rootDepsMap);
        const nativeGetValue = state.getValue;
        const nativeOnChange = state.onChange;
        state.getValue = () => (totalObservers > 0 ? nativeGetValue() : effectHandler(...states.map((s) => s())));
        state.onChange = (handler: (next: U, previous: U) => any, isLast?: boolean) => {
            totalObservers++;
            if (totalObservers === 1) {
                subscribe();
                exec();
            }
            const unsub = nativeOnChange(handler, isLast);
            let unsubbed = false;
            return () => {
                if (!unsubbed) {
                    unsubbed = true;
                    totalObservers--;
                    if (totalObservers === 0) {
                        unsubscribe();
                    }
                }
                unsub();
            };
        };
    } else {
        subscribe();
    }
    exec();
    return unsubscribe;
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
export function setEffect<T extends any[]>(effect: (...args: T) => any, states?: Dependencies<T>): () => void {
    return states instanceof Array ? handleFixed(states, effect) : handleEffect(effect);
}

/**
 * Creates a computed state based on an effect and its dependencies.
 *
 * @param effect - The effect handler function to be executed.
 * @param states - The states to be used as dependencies.
 * @returns A computed state that will be updated with the result of the effect.
 */
export function computed<T extends any[], U>(effect: (...args: T) => U, states?: Dependencies<T>): State<U> {
    const computed = state();
    states instanceof Array ? handleFixed(states, effect, computed) : handleEffect(effect, computed);
    return computed;
}
