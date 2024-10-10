/**
 * @module state/common
 * Common reusable function to create state
 */

import type { State } from './index.js';
import { state } from './index.js';

/**
 * A tuple containing the state, open, close, and toggle function.
 */
export type ToggleOutput<T> = [State<T>, () => void, () => void, () => void];

/**
 * Creates a toggleable state with initial value and functions to open, close, and toggle the state.
 * @param initial The initial value of the state.
 * @returns A tuple containing the state, open, close, and toggle function.
 */
export const stateToggle = <T>(initial: T): ToggleOutput<T> => {
    const st = state(initial);
    const open = () => st(true as T);
    const close = () => st(false as T);
    const toggle = () => st(!st() as T);
    return [st, open, close, toggle];
};

/**
 * Creates a state that is synchronized with browser localStorage, suppose to be used in browser environment
 * @param key The key to store the state in localStorage.
 * @param initial The initial value of the state.
 * @returns The reactive state.
 */
export const stateLocalStorage = (key: string, initial: string): State<string> => {
    const st = state(initial);
    const local = localStorage.getItem(key);
    if (local) {
        st(local);
    } else {
        localStorage.setItem(key, st());
    }
    st.onChange((value) => localStorage.setItem(key, value));
    return st;
};
