import { State, ChangeHandler, StateSubscription } from './State';

export type MultiChangeHandler<T> = (values: T[]) => any;

export interface MultiStateSubscription<T> {
    states: State<T>[];
    listener: MultiChangeHandler<T>;
    unsubscribe(): any;
    resubscribe(): any;
}
export interface StateValued<T> extends State<T> {
    value: T;
}

export function state<T>(initial: T): StateValued<T> {
    const o = new State(initial);
    return Object.defineProperties(o, {
        value: {
            get(): T {
                return o.getValue();
            },
            set(value: T) {
                o.setValue(value);
            }
        }
    }) as StateValued<T>;
}

export function observe<T>(state: State<T>, handler: ChangeHandler<T>): StateSubscription<T> {
    const subscription = state.onChange(handler);
    const value = state.getValue();
    handler(value, value);
    return subscription;
}

export function observeAll<T>(states: State<T>[], handler: MultiChangeHandler<T>): MultiStateSubscription<T> {
    const subscriptions = states.map(s => s.onChange(() => handler(states.map(s => s.getValue()))));
    handler(states.map(s => s.getValue()));
    return {
        states: states,
        listener: handler,
        unsubscribe() {
            for (const sub of subscriptions) {
                sub.unsubscribe();
            }
        },
        resubscribe() {
            for (const sub of subscriptions) {
                sub.resubscribe();
            }
        }
    }
}

export * from './State';
