import {
    Reactive,
    ReactiveUpdater,
    ReactiveCondition,
    Rule,
    Unsubscriber,
} from "./reactive";

export function onChange<T>(
    callback: ReactiveUpdater<T>,
    immediateCall: boolean,
    ...reactives: Reactive<T>[]
): Unsubscriber {
    const unsubscribers = reactives.map(sub => sub.onChange(callback, immediateCall));
    return () => unsubscribers.forEach(unsub => unsub());
}
export function when<T>(
    condition: ReactiveCondition<T>,
    callback: ReactiveUpdater<T>,
    ...reactives: Reactive<T>[]
): Unsubscriber {
    const unsubscribers = reactives.map(sub => sub.when(condition, callback));
    return () => unsubscribers.forEach(unsub => unsub());
}
export function update<T>(
    re: Reactive<T>,
    callback: (value: T) => T,
    condition?: (value: T) => boolean
): void {
    if (!condition) {
        re.value = callback(re.value);
    } else {
        while (condition(re.value)) {
            re.value = callback(re.value);
        }
    }
}
export function increase(
    re: number | Reactive<number>,
    add: number | Reactive<number> = 1,
    condition?: number | ((value: number) => boolean)
): void {
    const iter = re instanceof Reactive ? re : reactive(re);
    const adder = add instanceof Reactive ? add : reactive(add);
    if (!condition) {
        update(iter, value => value + adder.value);
    } else if (typeof condition === 'number') {
        const max = condition;
        update(iter, value => value + adder.value, value => value < max);
    } else {
        update(iter, value => value + adder.value, condition);
    }
}
export function decrease(
    re: number | Reactive<number>,
    sub: number | Reactive<number> = 1,
    condition: number | ((value: number) => boolean)
): void {
    const iter = re instanceof Reactive ? re : reactive(re);
    const subtractor = sub instanceof Reactive ? sub : reactive(sub);
    if (!condition) {
        update(iter, value => value - subtractor.value);
    } else if (typeof condition === 'number') {
        const min = condition;
        update(iter, value => value - subtractor.value, value => value > min);
    } else {
        update(iter, value => value - subtractor.value, condition);
    }
}
export function reactive<T>(initial?: T | Rule<T>, ...subscriptions: Reactive<any>[]): Reactive<T> {
    return new Reactive(initial, ...subscriptions);
}
