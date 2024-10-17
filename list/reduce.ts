/**
 * @module
 * List utilities to do reduce operations with reactive list
 */

import type { WatchableList } from '../common/watchable';
import type { Computed } from '../state';
import { stopify } from '../common/watchable';
import { computed, state } from '../state';

/**
 * Function parameter to handle reduce operation on list insert and delete
 */
type ReduceHandler<T, U> = (acc: U, item: T) => U;

/**
 * Function parameter to handler reduce operation on list update
 */
type ReduceUpdateHandler<T, U> = (acc: U, item: T, prev: T) => U;

/**
 * Object parameter to assign reduce handler to each operations
 */
interface ReduceOptions<T, U> {
    onInsert: ReduceHandler<T, U>;
    onDelete?: ReduceHandler<T, U>;
    onUpdate?: ReduceUpdateHandler<T, U>;
}

/**
 * call array reduce then handle each list update with each handler
 *
 * @param list reactive list to reduce
 * @param handler a function or an object that handles reduce calls
 * @param initial initial value
 * @returns state that will react to every list trigger event
 */
export function reduce<T, U>(
    list: WatchableList<T>,
    handler: ReduceHandler<T, U> | ReduceOptions<T, U>,
    initial: U
): Computed<U> {
    let reduce: ReduceOptions<T, U>;
    if (typeof handler === 'function') {
        reduce = { onInsert: handler };
    } else {
        reduce = handler;
    }
    const result = state(list().reduce((acc, item) => reduce.onInsert(acc, item), initial)) as Computed<U>;
    const unsubs = [];
    unsubs.push(list.onInsert((_, value) => result(reduce.onInsert(result(), value))));
    if (reduce.onDelete) {
        unsubs.push(list.onDelete((_, value) => result(reduce.onDelete!(result(), value))));
    }
    if (reduce.onUpdate) {
        unsubs.push(list.onUpdate((_, value, prev) => result(reduce.onUpdate!(result(), value, prev))));
    }
    result.stop = stopify(unsubs);
    return result;
}

/**
 * reactively calculate sum of every number in a reactive list
 *
 * @param list list to calculate
 * @returns a state that is the total sum of every number in the list
 */
export function sum(list: WatchableList<number>): Computed<number> {
    return reduce(
        list,
        {
            onInsert: (acc, item) => acc + item,
            onDelete: (acc, item) => acc - item,
            onUpdate: (acc, item, prev) => acc + (item - prev)
        },
        0
    );
}

/**
 * reactively calculate the length of a reactive list
 *
 * @param list list to calculate
 * @returns a state that store the length of a list
 */
export function count(list: WatchableList<any>): Computed<number> {
    const length = state(list().length) as Computed<number>;
    length.stop = stopify([list.onInsert(() => length(length() + 1)), list.onDelete(() => length(length() - 1))]);
    return length;
}

/**
 * reactively calculate the product of every number in a reactive list
 *
 * @param list list to calculate
 * @returns a state that is the total product of every number in the list
 */
export function product(list: WatchableList<number>): Computed<number> {
    const prodList = () => list().reduce((a, b) => a * b, 1);
    return reduce(
        list,
        {
            onInsert: (acc, item) => acc * item,
            onDelete: (acc, item) => (item === 0 ? prodList() : acc / item),
            onUpdate: (acc, item, prev) => (prev === 0 ? prodList() : acc * (item / prev))
        },
        1
    );
}

/**
 * reactively calculate the average of every number in a reactive list
 *
 * @param list list to calculate
 * @returns a state that is the average of each number in the list
 */
export function avg(list: WatchableList<number>): Computed<number> {
    const sumList = sum(list);
    const avgList = computed((sum) => (list().length === 0 ? 0 : sum / list().length), [sumList]);
    const avgUnsub = avgList.stop;
    avgList.stop = () => {
        sumList.stop();
        avgUnsub();
    };
    return avgList;
}
