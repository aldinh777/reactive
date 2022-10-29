/**
 * remove item from an array if item exists in that array
 *
 * @param elem item to remove from array
 * @param array array that stored said item
 */
export function removeFromArray<T>(elem: T, array: T[]): void {
    const index = array.indexOf(elem);
    if (index !== -1) {
        array.splice(index, 1);
    }
}

/**
 * push item to an array if item not exists in that array
 *
 * @param elem item to push to array
 * @param array array to be pushed
 */
export function pushNonExists<T>(elem: T, array: T[]): void {
    if (array.indexOf(elem) === -1) {
        array.push(elem);
    }
}
