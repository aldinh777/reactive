import { Subscription } from '../util';
import { State, ChangeHandler, StateSubscription } from './State';

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
    return {
        target: states,
        listener: handler,
        unsub() {
            for (const sub of subscriptions) {
                sub.unsub();
            }
        },
        resub() {
            for (const sub of subscriptions) {
                sub.resub();
            }
        }
    };
}

export * from './State';
