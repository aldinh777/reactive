import { Reactive, UpdateListener } from './Reactive';

export type MultiUpdateListener<T> = (values: T[]) => any;

export function removeFromArray<T>(elem: T, array: T[]): void {
    const index = array.indexOf(elem);
    if (index !== -1) {
        array.splice(index, 1);
    }
}

export function reactive<T>(initial: T) {
    return new Reactive(initial);
}

export function observe<T>(reactive: Reactive<T>, listener: UpdateListener<T>) {
    reactive.addListener(listener)
    listener(reactive.value)
}

export function observeAll<T>(reactives: Reactive<T>[], listener: MultiUpdateListener<T>) {
    reactives.forEach(r => r.addListener(() => listener(reactives.map(r => r.value))));
    listener(reactives.map(r => r.value));
}
