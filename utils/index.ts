import type { State } from '../state/index.js';
import type { Stoppable, Unsubscribe } from './subscription.js';
import { __ROOT_SET, __EFFECTS_STACK, __DYNAMICS } from '../state/internal.js';
import { state } from '../state/index.js';

export type Computed<T = any> = State<T> & Stoppable;
export type ComputedBuilder<T, U> = {
    (computer: () => T): Computed<T>;
    (states: State<T>[], computer: (...values: T[]) => U): Computed<U>;
};
export type EffectBuilder<T> = {
    (handler: () => any): Unsubscribe;
    (states: State<T>[], handler: (...values: T[]) => any): Unsubscribe;
};

function filterDeps(states: Set<State>) {
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

// Magic Typing
type Dependencies<T extends any[]> = { [K in keyof T]: State<T[K]> };

export const setEffect = <T extends any[]>(effect: (...args: T) => any, states?: Dependencies<T>): Unsubscribe =>
    states instanceof Array ? handleFixed(states, effect) : handleEffect(effect);

export const computed = <T extends any[], U>(effect: (...args: T) => U, states?: Dependencies<T>): Computed<U> => {
    const computed = state() as Computed<U>;
    computed.stop = states instanceof Array ? handleFixed(states, effect, computed) : handleEffect(effect, computed);
    return computed;
};
