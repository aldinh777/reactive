import type { State } from '../state/index.js';
import type { Unsubscribe } from './subscription.js';
import { __ROOT_SET, __MUTATED_DATA } from '../state/internal.js';
import { state } from '../state/index.js';

export interface MutatedState<T> extends State<T> {
    stop(): void;
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

function handleEffect<T>(effectHandler: () => T, state?: MutatedState<T>): [() => void, Unsubscribe] {
    if (__MUTATED_DATA._isExecuting) {
        throw Error('nested mutated or effect are not allowed');
    }
    const rootDepsMap = new Map<State, Unsubscribe>();
    if (state) {
        __ROOT_SET.set(state, rootDepsMap);
    }
    const exec = () => {
        __MUTATED_DATA._isExecuting = true;
        const result = effectHandler();
        const newDeps = filterDeps(__MUTATED_DATA._dependencies);
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
    const stop: Unsubscribe = () => {
        for (const [, unsub] of rootDepsMap) {
            unsub();
        }
        if (state) {
            __ROOT_SET.delete(state);
        }
    };
    return [exec, stop];
}

export const setEffect = (effectHandler: () => any): Unsubscribe => {
    const [exec, stop] = handleEffect(effectHandler);
    exec();
    return stop;
};

export const mutated = <T>(mutator: () => T) => {
    const st = state<T>() as MutatedState<T>;
    const [exec, stop] = handleEffect(mutator, st);
    st.stop = stop;
    exec();
    return st;
};
