export function removeFromArray<T>(elem: T, array: T[]): void {
    const index = array.indexOf(elem);
    if (index !== -1) {
        array.splice(index, 1);
    }
}

export function pushNonExists<T>(elem: T, array: T[]): void {
    if (!array.includes(elem)) {
        array.push(elem);
    }
}