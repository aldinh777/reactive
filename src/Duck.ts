import { quack, canQuack } from "./util";

export type DuckType<T> = T | Duck<T>;
export interface Duck<T> {
    (key: any, value: T): Duck<T>;
    value: T;
    isDuck: boolean;
    toArray(): T[];
    toMap(): Map<any, T>;
    toObject(): any;

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

const parseDuck = (d: any): Duck<any> => canQuack(d) ? d : duck(d);

export function duck<T>(initial?: T): Duck<T> {
    const __links: Duck<T>[] = [];
    const __map: Map<any, Duck<T>> = new Map();
    let __value: T = initial as T;
    const TheDuck: any = (key: any): Duck<T> => {
        if (key !== undefined) {
            const mapResult = __map.get(key);
            if (mapResult) {
                return mapResult;
            }
            const arrayResult = __links[key];
            return arrayResult;
        }
        return TheDuck;
    }
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
    TheDuck.toObject = (): any => {
        if (__map.size) {
            const result: any = {};
            __map.forEach((d, key) => result[key] = d.toObject());
            return result;
        } else if (__links.length) {
            return __links.map(d => d.toObject());
        } else {
            return TheDuck.value;
        }
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

export function duckFrom(item: any): Duck<any> {
    if (canQuack(item)) {
        return item;
    }
    const d = duck();
    if (item instanceof Array) {
        item.forEach(value => d.push(duckFrom(value)));
    } else if (item instanceof Map) {
        item.forEach((key, value) => d.set(key, duckFrom(value)));
    } else if (typeof item === 'object') {
        for (const key in item) {
            d.set(key, duckFrom(item[key]));
        }
    } else {
        d.value = item;
    }
    return d;
}
