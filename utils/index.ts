import type { State } from '../state/index.js';
import type { Stoppable, Unsubscribe } from './subscription.js';
import { __ROOT_SET, __EFFECT, __DYNAMICS } from '../state/internal.js';
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
    if (__EFFECT._tracking) {
        __EFFECT._tracking = false;
        __EFFECT._dependencies.clear();
        throw Error('nested computed or effect are not allowed');
    }
    const rootDepsMap = new Map<State, Unsubscribe>();
    if (state) {
        __DYNAMICS.add(state);
        __ROOT_SET.set(state, rootDepsMap);
    }
    const exec = () => {
        __EFFECT._tracking = true;
        const result = effectHandler();
        const newDeps = filterDeps(__EFFECT._dependencies);
        __EFFECT._tracking = false;
        __EFFECT._dependencies.clear();
        if (newDeps.size === 0) {
            throw Error('computed or effect has zero dependency');
        }
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

function handleStaticEffect<T, U>(states: State<T>[], handler: (...values: T[]) => U, state?: State<U>) {
    if (states.some((st) => __DYNAMICS.has(st))) {
        throw Error('attempting to create static effect or computed using some non-static states');
    }
    const rootDepsMap = new Map<State, Unsubscribe>();
    if (state) {
        __ROOT_SET.set(state, rootDepsMap);
    }
    const deps = filterDeps(new Set(states));
    if (deps.size === 0) {
        throw Error('static effect or computed must have at least one dependency');
    }
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

export const setEffect = <T>(handler: (...values: T[]) => any, dependencies?: State<T>[]) =>
    dependencies instanceof Array ? handleStaticEffect(dependencies, handler) : handleEffect(handler);

export const computed = <T, U>(computer: (...values: T[]) => U, dependencies?: State<T>[]) => {
    const computed = state() as Computed<U>;
    computed.stop =
        dependencies instanceof Array
            ? handleStaticEffect(dependencies, computer, computed)
            : handleEffect(computer, computed);
    return computed;
};
