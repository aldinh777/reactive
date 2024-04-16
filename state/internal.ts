import { Unsubscribe } from '../utils/subscription.js';
import { State } from './index.js';

/**
 * Weak Map that stores the root dependencies of each state to prevent
 * any state from having duplicate dependency or parent dependency
 */
export const __ROOT_SET = new WeakMap<State, Map<State, Unsubscribe>>();
export const __MUTATED_DATA = {
    _isExecuting: false,
    /**
     * The set of states that is being used while `mutated` or `effect` method is being executing
     */
    _dependencies: new Set<State>()
};
