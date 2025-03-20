import type { State } from './index';
import { state } from './index';

// for easier readings on function return type
type Open = () => void;
type Close = () => void;
type Toggle = () => void;

/**
 * Creates a toggleable state with initial value and functions to open, close, and toggle the state.
 * @param initial The initial value of the state.
 * @returns A tuple containing the state, open, close, and toggle function.
 */
export const stateToggle = (initial: boolean): [State<boolean>, Open, Close, Toggle] => {
    const s = state(initial);
    const open = () => s.setValue(true);
    const close = () => s.setValue(false);
    const toggle = () => s.setValue(!s.getValue());
    return [s, open, close, toggle];
};

/**
 * Creates a state that is synchronized with browser localStorage, suppose to be used in browser environment
 *
 * @param key The key to store the state in localStorage.
 * @param initial The initial value of the state.
 * @returns The reactive state.
 */
export const stateLocalStorage = (key: string, initial: string): State<string> => {
    const s = state(initial);
    const local = localStorage.getItem(key);
    if (local) {
        s.setValue(local);
    } else {
        localStorage.setItem(key, s.getValue());
    }
    s.onChange((value) => localStorage.setItem(key, value), true);
    return s;
};
