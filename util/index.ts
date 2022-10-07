import { createMultiSubscriptions, Subscription } from './helper';
import { State, ChangeHandler, StateSubscription } from '../state/State';

export type MultiChangeHandler<T> = (values: T[]) => any;
export type MultiStateSubscription<T> = Subscription<State<T>[], MultiChangeHandler<T>>;

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

export function observeAll<T>(
    states: State<T>[],
    handler: MultiChangeHandler<T>
): MultiStateSubscription<T> {
    const subscriptions = states.map((s) =>
        s.onChange(() => handler(states.map((s) => s.getValue())))
    );
    handler(states.map((s) => s.getValue()));
    return createMultiSubscriptions(states, handler, subscriptions);
}

export function stateObserve<T, U>(st: State<T>, handler: (value: T) => U): State<U> {
    const o: State<any> = state(undefined);
    observe(st, (value) => o.setValue(handler(value)));
    return o;
}

export function stateObserveAll<T, U>(states: State<T>[], handler: (values: T[]) => U): State<U> {
    const o: State<any> = state(undefined);
    observeAll(states, (values) => o.setValue(handler(values)));
    return o;
}
