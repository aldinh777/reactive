export type DuckType<T> = T|Duck<T>;

export type Maybe<T> = undefined|T;

export function quack(...args: any[]) {
    const quacks = args.length ? args : ['quack'];
    console.log(...quacks);
}

export function nest<T>(initial?: T) :Duck<Duck<T>> {
    return new Duck(new Duck(initial));
}

export class Duck<T> {
    protected __links: Duck<T>[] = []
    protected __map: Map<any, Duck<T>> = new Map()
    value?: T

    constructor(value?: T) {
        this.value = value;
    }
    get array() :Maybe<T>[] {
        return this.__links.map(d => d.value);
    }
    get keys() :any[] {
        return Array.from(this.__map.keys());
    }
    get values() :Maybe<T>[] {
        return Array.from(this.__map.values()).map(d => d.value);
    }
    // Array Override
    get length() :number {
        return this.__links.length;
    }
    push(...ducks: DuckType<T>[]) :number {
        return this.__links.push(...ducks.map(Duck.parseDuck));
    }
    pop() :Maybe<T> {
        const duck = this.__links.pop();
        if (duck) {
            return duck.value;
        }
    }
    shift() :Maybe<T> {
        const duck = this.__links.shift();
        if (duck) {
            return duck.value;
        }
    }
    unshift(...ducks: DuckType<T>[]) :number {
        return this.__links.unshift(...ducks.map(Duck.parseDuck));
    }
    splice(start: number, deleteCount: number = 0, ...args: DuckType<T>[]) :Maybe<T>[] {
        return this.__links.splice(start, deleteCount, ...args.map(Duck.parseDuck)).map(d => d.value);
    }
    // Map Override
    get size() :number {
        return this.__map.size;
    }
    set(key: any, value: DuckType<T>) :Duck<T> {
        const duck = Duck.parseDuck(value);
        this.__map.set(key, duck);
        return duck;
    }
    get(key: any) :Maybe<T> {
        const duck = this.__map.get(key);
        if (duck) {
            return duck.value;
        }
    }
    has(key: any) :boolean {
        return this.__map.has(key);
    }
    delete(key: any) :boolean {
        return this.__map.delete(key);
    }
    clear() :void {
        this.__map.clear();
    }
    // Quack
    quack(...quacks: any[]) {
        quack(...quacks);
    }
    duckAt(index: number) :Maybe<Duck<T>> {
        return this.__links[index];
    }
    getDuck(key: any) :Maybe<Duck<T>> {
        return this.__map.get(key);
    }
    static parseDuck<T>(duck: DuckType<T>) :Duck<T> {
        return duck instanceof Duck ? duck : new Duck(duck);
    }
    static fromArray<T>(array: T[], initial?: T) {
        const duck = new Duck<T>(initial);
        duck.push(...array);
        return duck;
    }
    static fromMap<T>(map: Map<any, T>, initial?: T) {
        const duck = new Duck<T>(initial);
        map.forEach((val, key) => duck.set(key, val));
        return duck;
    }
    static fromObject(obj: any, initial?: any) {
        const duck = new Duck(initial);
        for (const key in obj) {
            duck.set(key, obj[key]);
        }
        return duck;
    }
}
