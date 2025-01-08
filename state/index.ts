/**
 * @module
 * Base module that exposes definition and function to create State
 */

// ====================================================================================================
//    Internal module containing shared variables and functions to manage dependencies and effects.
// ====================================================================================================

const PLACEHOLDER_EMPTY = Symbol('empty');
const CIRCULAR_DETECTION_STATE = state(PLACEHOLDER_EMPTY);
const ROOT_DEPENDENCIES_MAP: WeakMap<State, Map<State, (() => void) | undefined>> = new WeakMap();
const DYNAMIC_STATES: WeakSet<State> = new WeakSet();
const EFFECTS_STACK: Set<State>[] = [];

// ====================================================================================================
//                                               State
// ====================================================================================================

/**
 * Reactive state interface that provides methods to get, set, and listen to value changes.
 */
export interface State<T = any> {
    /**
     * Retrieves current state value.
     */
    (): T;
    /**
     * Updates state with a new value.
     */
    (value: T): void;
    /**
     * Function to get current value, override if necessary
     */
    getValue(): T;
    /**
     * Registers a handler that will be called whenever the state changes.
     *
     * @param handler Function to be called when the state changes.
     * @param last If true, the handler will be called last after all other handlers have been called.
     * @returns Unsubscribe function to remove handler from the list of listeners.
     */
    onChange(handler: (next: T, prev: T) => any, last?: boolean): () => void;
}

/**
 * Creates and initializes a state.
 *
 * @param initial The initial value of the state.
 * @returns The reactive state.
 */
export function state<T = any>(initial?: T): State<T> {
    const listeners: Set<(next: T, prev: T) => any> = new Set();
    const lastListeners: Set<(next: T, prev: T) => any> = new Set();
    let value: T = initial as T;
    let isChanging = false;
    let willChange = false;

    const State = (nextValue: T | typeof PLACEHOLDER_EMPTY = PLACEHOLDER_EMPTY) => {
        const effectStack = EFFECTS_STACK.length ? EFFECTS_STACK[EFFECTS_STACK.length - 1] : null;
        if (nextValue === PLACEHOLDER_EMPTY) {
            effectStack?.add(State);
            return State.getValue();
        }

        let oldValue = value;
        value = nextValue;
        willChange = isChanging; /* ref 1 */

        if (effectStack?.has(State)) {
            effectStack.add(CIRCULAR_DETECTION_STATE);
        }

        // execute listeners only when the current state are not being used, this is to prevent recursion
        while (!isChanging) {
            isChanging = true;
            for (const handler of [...listeners, ...lastListeners]) {
                if (value !== oldValue) {
                    handler(value, oldValue); /* ref 2 */

                    // see ref 1, there is a chance ref 2 are invoking update of this state, thus setting the flag to true
                    if (willChange) {
                        break;
                    }
                }
            }

            // in case the listeners loop is stopped by break statement, reset the flag so it redo the while loop
            isChanging = !willChange;
            willChange = false;
        }

        // when the while loop is over, set back the flag to false.
        // but in case update are invoked by ref 2, then the flag will be retrieved from ref 1
        isChanging = willChange;
    };

    State.getValue = () => value;
    State.onChange = (handler: (next: T, prev: T) => any, last = false) => {
        const set = last ? lastListeners : listeners;
        set.add(handler);
        return () => set.delete(handler);
    };
    return State as State<T>;
}

// ====================================================================================================
//                                      Computed and Effects
// ====================================================================================================

function filterDependencies(states: Set<State>): Set<State> {
    const deps = new Set<State>();
    for (const dep of states) {
        if (ROOT_DEPENDENCIES_MAP.has(dep)) {
            const rootSet = ROOT_DEPENDENCIES_MAP.get(dep)!;
            for (const [root] of rootSet) {
                deps.add(root);
            }
        } else {
            deps.add(dep);
        }
    }
    return deps;
}

function handleEffect<T>(effectHandler: () => T, state?: State<T>): () => void {
    const rootDepsMap = new Map<State, () => void>();
    let totalObservers = 0;
    let recall = false;
    const exec = () => {
        while (true) {
            if (!state) {
                updateDependencies();
            } else if (totalObservers > 0) {
                state(updateDependencies());
            }
            if (recall) {
                recall = false;
                continue;
            } else {
                break;
            }
        }
    };
    const unsubscribe = () => {
        for (const unsub of rootDepsMap.values()) {
            unsub();
        }
        rootDepsMap.clear();
        if (state) {
            ROOT_DEPENDENCIES_MAP.delete(state);
        }
    };
    const updateDependencies = () => {
        EFFECTS_STACK.push(new Set());
        const result = effectHandler();
        const deps = EFFECTS_STACK.pop()!;
        if (deps.has(CIRCULAR_DETECTION_STATE)) {
            recall = true;
            return result;
        }
        for (const newDep of deps) {
            if (rootDepsMap.has(newDep)) {
                const unsub = rootDepsMap.get(newDep);
                unsub?.();
            }
            rootDepsMap.set(newDep, newDep.onChange(exec));
        }
        const rootDeps = filterDependencies(deps);
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
        DYNAMIC_STATES.add(state);
        const nativeGetValue = state.getValue;
        const nativeOnChange = state.onChange;
        state.getValue = () => (totalObservers > 0 ? nativeGetValue() : effectHandler());
        state.onChange = (handler: (next: T, previous: T) => any, isLast?: boolean) => {
            totalObservers++;
            if (totalObservers === 1) {
                ROOT_DEPENDENCIES_MAP.set(state, rootDepsMap);
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

function handleFixed<T, U>(states: State<T>[], effectHandler: (...args: T[]) => U, state?: State<U>): () => void {
    const executeEffect = () => effectHandler(...states.map((s) => s()));
    if (states.some((st) => DYNAMIC_STATES.has(st))) {
        return handleEffect(executeEffect, state);
    }
    const rootDepsMap = new Map<State, (() => void) | undefined>();
    const rootDeps = filterDependencies(new Set(states));
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
        ROOT_DEPENDENCIES_MAP.set(state, rootDepsMap);
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
