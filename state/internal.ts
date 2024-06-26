/**
 * @module
 * Shared module of internal variables to handles dependencies and effects
 */

import { Unsubscribe } from '../utils/subscription.js';
import { State } from './index.js';

/**
 * Weak Map that stores the root dependencies of each state to prevent
 * any state from having duplicate dependency or parent dependency
 */
export const __ROOT_SET = new WeakMap<State, Map<State, Unsubscribe>>();
/**
 * Weak Set that stores any states that is created using computed
 */
export const __DYNAMICS = new WeakSet<State>();
/**
 * This thing store the dependencies set for each stack of effects
 */
export const __EFFECTS_STACK: Set<State>[] = [];
