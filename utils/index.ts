import type { State } from '../state/index.js';
import type { Unsubscribe } from './subscription.js';
import { __ROOT_SET, __MUTATED_DATA, __DYNAMICS } from '../state/internal.js';
import { state } from '../state/index.js';

export interface Computed<T> extends State<T> {
    stop: Unsubscribe;
}

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
    if (__MUTATED_DATA._isExecuting) {
        __MUTATED_DATA._isExecuting = false;
        throw Error('nested mutated or effect are not allowed');
    }
    const rootDepsMap = new Map<State, Unsubscribe>();
    if (state) {
        __DYNAMICS.add(state);
        __ROOT_SET.set(state, rootDepsMap);
    }
    const exec = () => {
        __MUTATED_DATA._isExecuting = true;
        const result = effectHandler();
        const newDeps = filterDeps(__MUTATED_DATA._dependencies);
        if (newDeps.size === 0) {
            throw Error('mutated or effect has zero dependency');
        }
        __MUTATED_DATA._isExecuting = false;
        __MUTATED_DATA._dependencies.clear();
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
        throw Error(
            'creating static effect or mutated using some states that may have dynamic dependency is forbidden'
        );
    }
    const rootDepsMap = new Map<State, Unsubscribe>();
    if (state) {
        __ROOT_SET.set(state, rootDepsMap);
    }
    const deps = filterDeps(new Set(states));
    if (deps.size === 0) {
        throw Error('static effect or mutated must have at least one dependency');
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

export const setEffect = (effectHandler: () => any) => handleEffect(effectHandler);

export const setEffectStatic = <T>(states: State<T>[], handler: (...values: T[]) => any) =>
    handleStaticEffect(states, handler);

export const computed = <T>(computer: () => T) => {
    const st = state() as Computed<T>;
    st.stop = handleEffect(computer, st);
    return st;
};

export const computedStatic = <T, U>(states: State<T>[], computer: (...values: T[]) => U) => {
    const st = state() as Computed<U>;
    st.stop = handleStaticEffect(states, computer, st);
    return st;
};
