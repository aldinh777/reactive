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
    return reactives.length > 0 ? onChange(callback, true, ...reactives) : Reactive.observe(callback);
}
export function when<T>(
    condition: (val?: T, ev?: ReactiveEvent<T>) => boolean,
    callback: ReactiveUpdater<T>,
    ...reactives: Reactive<T>[]
): Unsubscriber {
    return reactives.length > 0 
        ? observe((value, ev) => condition(value, ev) && callback(value, ev), ...reactives)
        : Reactive.observeIf(condition, (value, ev) => condition() && callback(value, ev));
}
export function update<T>(
    re: Reactive<T>,
    callback: (val: T, ...args: any[]) => T,
    ...args: any[]
) {
    re.value = callback(re.value as T, ...args.map(r => r instanceof Reactive ? r.value : r));
}

export function increase(
    re: Reactive<number>,
    add: number | Reactive<number> = 1,
    condition: number | (() => boolean) = () => false
): void {
    if (typeof condition === 'number') {
        const max = condition;
        condition = () => re.value < max;
    }
    do {
        update(re, (val, add) => val + add, add);
    } while (condition());
}
export function decrease(
    re: Reactive<number>,
    sub: number | Reactive<number> = 1,
    condition: number | (() => boolean) = () => false
): void {
    if (typeof condition === 'number') {
        const min = condition;
        condition = () => re.value > min;
    }
    do {
        update(re, (val, add) => val - add, sub);
    } while (condition());
}

export function reactive<T>(initial?: ReactiveValue<T>): Reactive<T> {
    return new Reactive(initial);
}
