import type { State } from '../state/index.js';
import type { Unsubscribe } from './subscription.js';
import { pushNonExists } from '@aldinh777/toolbox/array-operation.js';
import { __ROOT_LIST, __MUTATED_DATA } from '../state/internal.js';
import { state } from '../state/index.js';

export interface MutatedState<T> extends State<T> {
    stop(): void;
}

function filterDependency(states: State[]) {
    const deps: State[] = [];
    for (const dep of states) {
        if (__ROOT_LIST.has(dep)) {
            const rl = __ROOT_LIST.get(dep)!;
            for (const root of rl) {
                pushNonExists(deps, root);
            }
        } else {
            pushNonExists(deps, dep);
        }
    }
    return deps;
}

export const effectFrom = <T>(...states: State<T>[]) => {
    const deps = filterDependency(states);
    return (handler: (...values: T[]) => any, execute = true): Unsubscribe => {
        const exec = () => handler(...states.map((s) => s()));
        const unsubs: Unsubscribe[] = [];
        for (const dep of deps) {
            dep.onChange(exec);
        }
        if (execute) {
            exec();
        }
        return () => {
            for (const unsub of unsubs) {
                unsub();
            }
        };
    };
};

export const mutatedFrom = <T>(...states: State<T>[]) => {
    const dependencies = filterDependency(states);
    return <U>(handler: (...values: T[]) => U, execute = true): MutatedState<U> => {
        const st = state<U>() as MutatedState<U>;
        const exec = () => st(handler(...states.map((s) => s())));
        const unsubs: Unsubscribe[] = [];
        for (const dep of dependencies) {
            unsubs.push(dep.onChange(exec));
        }
        if (execute) {
            exec();
        }
        __ROOT_LIST.set(st, dependencies);
        st.stop = () => {
            for (const unsub of unsubs) {
                unsub();
            }
        };
        st.toString = () => `Mutated { value: ${st()} }`;
        return st;
    };
};

export const effect = (effectHandler: () => any): Unsubscribe => {
    if (__MUTATED_DATA._isExecuting) {
        throw Error('nested effect are not allowed');
    }
    __MUTATED_DATA._isExecuting = true;
    effectHandler();
    const unsub = effectFrom(...__MUTATED_DATA._dependencies)(effectHandler, false);
    __MUTATED_DATA._isExecuting = false;
    __MUTATED_DATA._dependencies.clear();
    return unsub;
};

export const mutated = <T>(mutator: () => T) => {
    if (__MUTATED_DATA._isExecuting) {
        throw Error('nested mutated are not allowed');
    }
    __MUTATED_DATA._isExecuting = true;
    const result = mutator();
    const st = mutatedFrom(...__MUTATED_DATA._dependencies)(mutator, false);
    st(result);
    __MUTATED_DATA._isExecuting = false;
    __MUTATED_DATA._dependencies.clear();
    return st;
};
