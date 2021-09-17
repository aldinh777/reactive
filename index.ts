import { Reactive, ReactiveEvent, ReactiveUpdater, ReactiveValue, Unsubscriber } from './src/Reactive';

export { Reactive, ReactiveEvent, ReactiveUpdater, ReactiveValue, Unsubscriber } from './src/Reactive';
export { Duck, DuckType, Maybe, quack } from './src/Duck';
export { DinoFunction, SpinoFunction, dino, spino } from './src/dino';

export function onChange<T>(callback: ReactiveUpdater<T>, immediateCall: boolean, ...reactives: Reactive<T>[]) :Unsubscriber {
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
export function when <T>(condition: (val: T, ev: ReactiveEvent<T>) => boolean, callback: ReactiveUpdater<T>, ...reactives: Reactive<T>[]) :Unsubscriber {
    return onChange(ev => condition(ev.currentReactive.value as T, ev) && callback(ev), true, ...reactives);
}
export function update<T>(re: Reactive<T>, callback: (val: T, ...args: any[]) => T, ...args: any[]) {
    re.value = callback(re.value as T, ...args);
}
export function increase(re: Reactive<number>, add: number|Reactive<number> = 1, condition: () => boolean =  () => false) :void {
    do {
        update(re, val => val + (add instanceof Reactive ? add.value as number : add));
    } while (condition());
}
export function decrease(re: Reactive<number>, sub: number|Reactive<number> = 1, condition: () => boolean =  () => false) :void {
    do {
        update(re, val => val - (sub instanceof Reactive ? sub.value as number : sub));
    } while (condition());
}

export function reactive<T>(initial?: ReactiveValue<T>) :Reactive<T> {
    return new Reactive(initial);
}

export default reactive;
