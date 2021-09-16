export type DuckType<T> = T|Duck<T>;

export type Maybe<T> = undefined|T;

export function quack(...args: any[]) :Promise<any[]> {
    const quacks = args.length ? args : ['quack'];
    const results = Promise.all(quacks.map(q => q instanceof Promise ? q : Promise.resolve(q)));
    results.then(quacks => console.log(...quacks));
    return results;
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
    get map() :Map<any, T> {
        const map = new Map();
        this.__map.forEach((duck, key) => map.set(key, duck.value));
        return map;
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
    duckAt(...indexes: number[]) :Maybe<Duck<T>> {
        const index = indexes.shift();
        if (index !== undefined) {
            if (indexes.length <= 0) {
                return this.__links[index];
            }
            if (!this.__links[index]) {
                return undefined;
            }
            return this.__links[index].duckAt(...indexes);
        }
    }
    getDuck(...keys: any[]) :Maybe<Duck<T>> {
        const key = keys.shift();
        if (key !== undefined) {
            if (keys.length <= 0) {
                return this.__map.get(key);
            }
            const duck = this.__map.get(key);
            if (duck) {
                return duck.getDuck(...keys);
            }
        }
    }
    static parseDuck<T>(duck: DuckType<T>) :Duck<T> {
        return duck instanceof Duck ? duck : new Duck(duck);
    }
    static from(obj: any) :Duck<any> {
        if (obj instanceof Duck) {
            return obj;
        }
        const duck = new Duck();
        if (obj instanceof Array) {
            duck.push(...obj.map(Duck.from));
        } else if (obj instanceof Map) {
            obj.forEach((val, key) => duck.set(key, Duck.from(val)));
        } else if (typeof obj === 'object') {
            for (const key in obj) {
                duck.set(key, Duck.from(obj[key]));
            }
        } else {
            duck.value = obj;
        }
        return duck;
    }
}
