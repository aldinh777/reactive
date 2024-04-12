import type { State } from '../state/index.js';
import { pushNonExists } from '@aldinh777/toolbox/array-operation.js';
import { __ROOT_LIST, __MUTATED_DATA } from '../state/internal.js';
import { state } from '../state/index.js';

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

export const observe = <T>(...states: State<T>[]) => {
    const deps = filterDependency(states);
    return (handler: (...values: T[]) => any, execute = true) => {
        const exec = () => handler(...states.map((s) => s()));
        for (const dep of deps) {
            dep.onChange(exec);
        }
        if (execute) {
            exec();
        }
    };
};

export const stateFrom = <T>(...states: State<T>[]) => {
    const dependencies = filterDependency(states);
    return <U>(handler: (...values: T[]) => U, execute = true) => {
        const st = state<U>();
        const exec = () => st(handler(...states.map((s) => s())));
        for (const dep of dependencies) {
            dep.onChange(exec);
        }
        if (execute) {
            exec();
        }
        __ROOT_LIST.set(st, dependencies);
        return st;
    };
};

export const mutated = <T>(mutator: () => T) => {
    if (__MUTATED_DATA._isExecuting) {
        throw Error('nested mutated are not allowed');
    }
    __MUTATED_DATA._isExecuting = true;
    const result = mutator();
    const st = stateFrom(...__MUTATED_DATA._dependencies)(mutator, false);
    st(result);
    __MUTATED_DATA._isExecuting = false;
    __MUTATED_DATA._dependencies.clear();
    return st;
};
