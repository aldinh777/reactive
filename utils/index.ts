import { pushNonExists } from '@aldinh777/toolbox/array-operation';
import { State, state } from '../state';

const ROOT_LIST = new WeakMap<State, State[]>();

function filterDependency(states: State[]) {
    const deps: State[] = [];
    for (const dep of states) {
        if (ROOT_LIST.has(dep)) {
            const rl = ROOT_LIST.get(dep)!;
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
    return (handler: (...values: T[]) => any) => {
        const exec = () => handler(...states.map((s) => s()));
        for (const dep of deps) {
            dep.onChange(exec);
        }
        exec();
    };
};

export const stateFrom = <T>(...states: State<T>[]) => {
    const dependencies = filterDependency(states);
    return <U>(handler: (...values: T[]) => U) => {
        const st = state<U>();
        const exec = () => st(handler(...states.map((s) => s())));
        for (const dep of dependencies) {
            dep.onChange(exec);
        }
        exec();
        ROOT_LIST.set(st, dependencies);
        return st;
    };
};
