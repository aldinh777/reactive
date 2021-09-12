import Reactive, { ReactiveEvent, ReactiveUpdater, ReactiveValue, Unsubscriber } from './Reactive';

export { default as Reactive } from './Reactive';
export {
    ReactiveEvent,
    ReactiveUpdater,
    ReactiveValue,
    Unsubscriber,
} from './Reactive';

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
    return onChange(ev => condition(ev.currentReactive.value, ev) && callback(ev), true, ...reactives);
}
export function update<T>(re: Reactive<T>, callback: (val: T, ...args: any[]) => T, ...args: any[]) {
    re.value = callback(re.value, ...args);
}
export function increase(re: Reactive<number>, add: number|Reactive<number> = 1) {
    update(re, val => val + (add instanceof Reactive ? add.value : add));
};
export function decrease(re: Reactive<number>, sub: number|Reactive<number> = 1) {
    update(re, val => val - (sub instanceof Reactive ? sub.value : sub));
};

export default function reactive<T>(initial?: ReactiveValue<T>) {
    return new Reactive(initial);
}
reactive.onChange = onChange;
reactive.when = when;
reactive.update = update;
reactive.increase = increase;
reactive.decrease = decrease;
