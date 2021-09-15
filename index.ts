import { Duck } from './src/Duck';
import { Reactive, ReactiveEvent, ReactiveUpdater, ReactiveValue, Unsubscriber } from './src/Reactive';

export { Reactive, ReactiveEvent, ReactiveUpdater, ReactiveValue, Unsubscriber } from './src/Reactive';
export { Duck, DuckType, Maybe, nest, quack } from './src/Duck';
export { DinoFunction, dino } from './src/dino';

export function onChange<T>(callback: ReactiveUpdater<T>, immediateCall: boolean, ...reactives: Reactive<T>[]) {
    const unsubscribers: Unsubscriber[] = [];
    for (const subscriber of reactives) {
        unsubscribers.push(subscriber.onChange(callback, immediateCall));
    }
    return () => {
        for (const unsubscribe of unsubscribers) {
            unsubscribe();
        }
    };
}
export function when <T>(condition: (val: T, ev: ReactiveEvent<T>) => boolean, callback: ReactiveUpdater<T>, ...reactives: Reactive<T>[]) {
    return onChange(ev => condition(ev.currentReactive.value as T, ev) && callback(ev), true, ...reactives);
}
export function update<T>(re: Reactive<T>, callback: (val: T, ...args: any[]) => T, ...args: any[]) {
    re.value = callback(re.value as T, ...args);
}
export function increase(re: Reactive<number>, add: number|Reactive<number> = 1) {
    update(re, val => val + (add instanceof Reactive ? add.value as number : add));
}
export function decrease(re: Reactive<number>, sub: number|Reactive<number> = 1) {
    update(re, val => val - (sub instanceof Reactive ? sub.value as number : sub));
}

export function reactive<T>(initial?: ReactiveValue<T>) :Reactive<T> {
    return new Reactive(initial);
}
export function duck<T>(initial?: T) :Duck<T> {
    return new Duck(initial);
}

export default reactive;
