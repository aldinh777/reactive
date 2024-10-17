/**
 * @module
 * List utilities to do reduce operations with reactive list
 */

import type { WatchableList } from '../common/watchable';
import type { State } from '../state';
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
): State<U> {
    let reduce: ReduceOptions<T, U>;
    if (typeof handler === 'function') {
        reduce = { onInsert: handler };
    } else {
        reduce = handler;
    }
    const result = state(list().reduce((acc, item) => reduce.onInsert(acc, item), initial));
    list.onInsert((_, value) => result(reduce.onInsert(result(), value)));
    if (reduce.onDelete) {
        list.onDelete((_, value) => result(reduce.onDelete!(result(), value)));
    }
    if (reduce.onUpdate) {
        list.onUpdate((_, value, prev) => result(reduce.onUpdate!(result(), value, prev)));
    }
    return result;
}

/**
 * reactively calculate sum of every number in a reactive list
 *
 * @param list list to calculate
 * @returns a state that is the total sum of every number in the list
 */
export function sum(list: WatchableList<number>): State<number> {
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
export function count(list: WatchableList<any>): State<number> {
    return reduce(
        list,
        {
            onInsert: (acc) => acc + 1,
            onDelete: (acc) => acc - 1
        },
        0
    );
}

/**
 * reactively calculate the product of every number in a reactive list
 *
 * @param list list to calculate
 * @returns a state that is the total product of every number in the list
 */
export function product(list: WatchableList<number>): State<number> {
    return reduce(
        list,
        {
            onInsert: (acc, item) => acc * item,
            onDelete: (acc, item) => acc / item,
            onUpdate: (acc, item, prev) => acc * (item / prev)
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
export function avg(list: WatchableList<number>): State<number> {
    return computed((sum) => sum / list().length, [sum(list)]);
}
