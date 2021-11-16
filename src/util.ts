import { Reactive, Rule } from './Reactive';

export function removeFromArray<T>(elem: T, array: T[]): void {
    const index = array.indexOf(elem);
    if (index !== -1) {
        array.splice(index, 1);
    }
}

export function reactive<T>(initial?: T | Rule<T>, ...subscriptions: Reactive<any>[]): Reactive<T> {
    return new Reactive(initial, ...subscriptions);
}
