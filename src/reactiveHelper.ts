import {
    Reactive,
    ReactiveEvent,
    ReactiveUpdater,
    ReactiveValue,
    Unsubscriber,
} from "./Reactive";

export function onChange<T>(
    callback: ReactiveUpdater<T>,
    immediateCall: boolean,
    ...reactives: Reactive<T>[]
): Unsubscriber {
    const unsubscribers = reactives.map(sub => sub.onChange(callback, immediateCall));
    return () => unsubscribers.forEach(unsub => unsub());
}
export function observe<T>(
    callback: ReactiveUpdater<T>,
    ...reactives: Reactive<T>[]
): Unsubscriber {
    return reactives.length
        ? onChange(callback, true, ...reactives)
        : Reactive.observe(callback);
}
export function when<T>(
    condition: (val?: T, ev?: ReactiveEvent<T>) => boolean,
    callback: ReactiveUpdater<T>,
    ...reactives: Reactive<T>[]
): Unsubscriber {
    return reactives.length
        ? observe((value, ev) => condition(value, ev) && callback(value, ev), ...reactives)
        : Reactive.observeIf(condition, callback);
}
export function update<T>(
    re: Reactive<T>,
    callback: (val: T, ...args: any[]) => T,
    ...args: any[]
) {
    re.value = callback(re.value as T, ...args.map(r => r instanceof Reactive ? r.value : r));
}
export function increase(
    re: number | Reactive<number>,
    add: number | Reactive<number> = 1,
    condition?: number | ((value: number) => boolean)
): void {
    const iter = re instanceof Reactive ? re : reactive(re);
    if (!condition) {
        update(iter, (val, add) => val + add, add);
    } else {
        if (typeof condition === 'number') {
            const max = condition;
            condition = value => value < max;
        }
        do {
            update(iter, (val, add) => val + add, add);
        } while (condition(iter.value));
    }
}
export function decrease(
    re: number | Reactive<number>,
    sub: number | Reactive<number> = 1,
    condition: number | ((value: number) => boolean) = () => false
): void {
    const iter = re instanceof Reactive ? re : reactive(re);
    if (!condition) {
        update(iter, (val, sub) => val - sub, sub);
    } else {
        if (typeof condition === 'number') {
            const min = condition;
            condition = value => value > min;
        }
        do {
            update(iter, (val, add) => val - add, sub);
        } while (condition(iter.value));
    }
}
export function reactive<T>(initial?: ReactiveValue<T>): Reactive<T> {
    return new Reactive(initial);
}
