export function removeFromArray<T>(elem: T, array: T[]): void {
    const index = array.indexOf(elem);
    if (index !== -1) {
        array.splice(index, 1);
    }
}

export function quack(...args: any[]): any {
    const quacks = args.length ? args : ['quack'];
    if (quacks.find(q => q instanceof Promise)) {
        const results = Promise.all(quacks.map(q => q instanceof Promise ? q.catch(err => err) : Promise.resolve(q)));
        results.then(quacks => console.log(...quacks));
        return results;
    }
    console.log(...quacks);
}

export function canQuack(d: any): boolean {
    return d.quack;
}