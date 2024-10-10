/**
 * Internal module containing shared variables and functions to manage
 * dependencies and effects.
 */

import { Unsubscribe } from '../utils/subscription.js';
import { State } from './index.js';

/**
 * A WeakMap that maps each state to its root dependencies. This is used
 * to prevent any state from having duplicate dependencies or parent
 * dependencies.
 */
export const __ROOT_SET: WeakMap<State, Map<State, Unsubscribe>> = new WeakMap();

/**
 * A WeakSet that stores all states created using the `computed` function.
 */
export const __DYNAMICS: WeakSet<State> = new WeakSet();

/**
 * An array of Sets that stores the dependencies of each stack of effects.
 */
export const __EFFECTS_STACK: Set<State>[] = [];
