import type { State } from './index.js';
import { state } from './index.js';

/**
 * An array containing the state, open, close, and toggle function.
 */
type ToggleOutput = [state: State<boolean>, open: Function, close: Function, toggle: Function];

/**
 * Creates a toggleable state with initial value and functions to open, close, and toggle the state.
 */
export const stateToggle = (initial: boolean): ToggleOutput => {
    const st = state(initial);
    const open = () => st(true);
    const close = () => st(false);
    const toggle = () => st(!st());
    return [st, open, close, toggle];
};

/**
 * Creates a state that is synchronized with browser localStorage, suppose to be used in browser environment
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
