import { State } from './index.js';

export const __ROOT_LIST = new WeakMap<State, State[]>();
export const __MUTATED_DATA = {
    _isExecuting: false,
    _dependencies: new Set<State>()
};
