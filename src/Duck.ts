export type DuckType<T> = T | Duck<T>;
export interface Duck<T> {
    (key: any, value: T): Duck<T>;
    value: T;
    isDuck: boolean;
    toArray(): T[];
    toMap(): Map<any, T>;

    length: number;
    push(...args: DuckType<T>[]): number;
    pop(): Duck<T> | undefined;
    shift(): number;
    unshift(...args: DuckType<T>[]): Duck<T> | undefined;
    splice(start: number, deleteCount?: number, ...args: DuckType<T>[]): Duck<T>[];

    size: number;
    set(key: any, value: T): Duck<T>;
    get(key: any): T | undefined;
    clear(): void;
    delete(key: any): boolean;
    has(key: any): boolean;
};

export function quack(...args: any[]): any {
    const quacks = args.length ? args : ['quack'];
    if (quacks.find(q => q instanceof Promise)) {
        const results = Promise.all(quacks.map(q => q instanceof Promise ? q.catch(err => err) : Promise.resolve(q)));
        results.then(quacks => console.log(...quacks));
        return results;
    }
    console.log(...quacks);
}

export function duck<T>(initial?: T): Duck<T> {
    const __links: Duck<T>[] = [];
    const __map: Map<any, Duck<T>> = new Map();
    let __value: T = initial as T;
    const TheDuck: any = (key: any, value: T): Duck<T> => {
        if (key !== undefined && value !== undefined) {
            const proto = __links[key];
            proto.value = value;
            return proto;
        }
        if (key !== undefined) {
            return __links[key];
        }
        return TheDuck;
    }
    const canQuack = (d: any) => d.quack as boolean;
    const parseDuck = (d: any) => canQuack(d) ? d : duck(d);
    // Array Override
    TheDuck.push = (...args: DuckType<T>[]): number => __links.push(...args.map(parseDuck));
    TheDuck.pop = (): Duck<T> | undefined => __links.pop();
    TheDuck.shift = (): Duck<T> | undefined => __links.shift();
    TheDuck.unshift = (...args: T[]): number => __links.unshift(...args.map(parseDuck));
    TheDuck.splice = (start: number, deleteCount: number = 0, ...args: DuckType<T>[]): Duck<T>[] => {
        return __links.splice(start, deleteCount, ...args.map(parseDuck));
    };
    // Map Override
    TheDuck.set = (key: any, value: T): Duck<T> => {
        __map.set(key, parseDuck(value));
        return TheDuck;
    };
    TheDuck.get = (key: any): T | undefined => {
        const fetchDuck = __map.get(key)
        return fetchDuck ? fetchDuck.value : undefined;
    };
    TheDuck.clear = (): void => __map.clear();
    TheDuck.delete = (key: any): boolean => __map.delete(key);
    TheDuck.has = (key: any): boolean => __map.has(key);
    // Unducking
    TheDuck.toArray = (): T[] => {
        return __links.map(d => d.value)
    };
    TheDuck.toMap = (): Map<any, T> => {
        const map = new Map();
        __map.forEach((d, key) => map.set(key, d.value));
        return map;
    }
    // Properties
    TheDuck.quack = (...args: any[]): void => quack(...args);
    Object.defineProperty(TheDuck, 'value', {
        get: () => __value,
        set: (value) => __value = value,
    });
    Object.defineProperty(TheDuck, 'length', { get: () => __links.length });
    Object.defineProperty(TheDuck, 'size', { get: () => __map.size });
    return TheDuck;
}
