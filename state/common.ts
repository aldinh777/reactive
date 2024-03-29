import { State, state } from './index.js';

type ToggleOutput = [state: State<boolean>, open: Function, close: Function, toggle: Function];
export const stateToggle = (initial: boolean): ToggleOutput => {
    const st = state(initial);
    const open = () => st(true);
    const close = () => st(false);
    const toggle = () => st(!st());
    return [st, open, close, toggle];
};

export const stateLocalStorage = (key: string, initial: string) => {
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
