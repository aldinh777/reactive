import { subscribe, Subscription } from '../helper/subscription-helper';

export type UpdateListener<T> = (value: T) => any;
export type ChangeHandler<T> = (next: T, previous: T) => any;

interface State<T = any> {
    (value?: T): T;
    onChange(handler: ChangeHandler<T>): Subscription;
}

export function state<T = any>(initial?: T): State<T> {
    /** List of active update listeners */
    let upd: UpdateListener<T>[] = [];
    /** The actual value being stored */
    let val: T = initial;
    /**
     *  Update Lock :   Prevent state from executing another listener
     *                  while it is currently executing listener to
     *                  prevent infinite recursion
     */
    let ulock = false;
    /**
     *  Handler Lock :  Prevent next listeners from being executed
     *                  and act as marker
     */
    let hlock = false;
    const State = (...arg: T[]) => {
        if (arg.length) {
            val = arg[0];
            hlock = ulock;
            while (!ulock) {
                ulock = true;
                for (const listener of upd) {
                    listener(val);
                    if (hlock) {
                        break;
                    }
                }
                ulock = !hlock;
                hlock = false;
            }
            ulock = hlock;
        } else {
            return val;
        }
    };
    State.onChange = (handler: ChangeHandler<T>) => {
        let oldValue = val;
        return subscribe((value: T) => {
            if (value !== oldValue) {
                handler(value, oldValue);
                oldValue = value;
            }
        }, upd);
    };
    return State;
}
