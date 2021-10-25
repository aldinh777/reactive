import { isDuck } from './util';

export type DuckType<T> = T | Duck<T>;
export type DucktorFuncQuery = (key: any, parent: Duck<any>, index: number) => boolean;
export type DucktorQuery = '*' | DucktorFuncQuery | string | number;
export interface Duck<T> {
    (key: any): Duck<T>;
    value: T;
    type: string;
    forEach(callback: (duck: Duck<T>, key: any) => void): void;
    query(query: DucktorQuery): Ducktor;
    toArray(): T[];
    toMap(): Map<any, T>;
    toObject(): any;
    // Array Operation
    length: number;
    push(...args: DuckType<T>[]): number;
    pop(): Duck<T> | undefined;
    shift(): number;
    unshift(...args: DuckType<T>[]): Duck<T> | undefined;
    splice(start: number, deleteCount?: number, ...args: DuckType<T>[]): Duck<T>[];
    // Map Operation
    size: number;
    set(key: any, value: T): Duck<T>;
    get(key: any): T | undefined;
    clear(): void;
    delete(key: any): boolean;
    has(key: any): boolean;
}
export interface Ducktor {
    (query: DucktorQuery): Ducktor;
    at(index: number): Duck<any>;
    toDuck(): Duck<any>;
    toObject(): any;
}

const parseDuck = (d: any): Duck<any> => isDuck(d) ? d : duck(d);

export function duck<T>(initial?: T): Duck<T> {
    const __links: Duck<T>[] = [];
    const __map: Map<any, Duck<T>> = new Map();
    let __value: T = initial as T;
    const DuckWrapper: any = (key: any): Duck<T> => {
        if (key !== undefined) {
            const mapResult = __map.get(key);
            if (mapResult) {
                return mapResult;
            }
            const arrayResult = __links[key];
            return arrayResult;
        }
        return DuckWrapper;
    }
    // Array Override
    DuckWrapper.push = (...args: DuckType<T>[]): number => __links.push(...args.map(parseDuck));
    DuckWrapper.pop = (): Duck<T> | undefined => __links.pop();
    DuckWrapper.shift = (): Duck<T> | undefined => __links.shift();
    DuckWrapper.unshift = (...args: T[]): number => __links.unshift(...args.map(parseDuck));
    DuckWrapper.splice = (start: number, deleteCount: number = 0, ...args: DuckType<T>[]): Duck<T>[] => {
        return __links.splice(start, deleteCount, ...args.map(parseDuck));
    };
    // Map Override
    DuckWrapper.set = (key: any, value: T): Duck<T> => {
        __map.set(key, parseDuck(value));
        return DuckWrapper;
    };
    DuckWrapper.get = (key: any): T | undefined => {
        const fetchDuck = __map.get(key)
        return fetchDuck ? fetchDuck.value : undefined;
    };
    DuckWrapper.clear = (): void => __map.clear();
    DuckWrapper.delete = (key: any): boolean => __map.delete(key);
    DuckWrapper.has = (key: any): boolean => __map.has(key);
    // Unducking
    DuckWrapper.toArray = (): T[] => {
        return __links.map(d => d.value)
    };
    DuckWrapper.toMap = (): Map<any, T> => {
        const map = new Map();
        __map.forEach((d, key) => map.set(key, d.value));
        return map;
    }
    DuckWrapper.toObject = (): any => {
        if (__map.size) {
            const result: any = {};
            __map.forEach((d, key) => result[key] = d.toObject());
            return result;
        } else if (__links.length) {
            return __links.map(d => d.toObject());
        } else {
            return DuckWrapper.value;
        }
    }
    // Properties
    DuckWrapper.forEach = (callback: (duck: Duck<T>, key: any) => void) => {
        __links.forEach((duck, index) => callback(duck, index));
        __map.forEach((duck, key) => callback(duck, key));
    };
    DuckWrapper.query = (query: DucktorQuery): Ducktor => {
        const result: Duck<any>[] = [];
        if (query === '*') {
            DuckWrapper.forEach((d: Duck<T>) => result.push(d));
        } else if (typeof query === 'function') {
            DuckWrapper.forEach((d: Duck<T>, key: any) => {
                if (query(key, DuckWrapper, 0)) {
                    result.push(d);
                }
            });
        } else {
            result.push(DuckWrapper(query));
        }
        return ducktor(result);
    };
    Object.defineProperty(DuckWrapper, 'value', {
        get: () => __value,
        set: (value) => __value = value,
    });
    Object.defineProperty(DuckWrapper, 'type', { get: () => 'duck' });
    Object.defineProperty(DuckWrapper, 'length', { get: () => __links.length });
    Object.defineProperty(DuckWrapper, 'size', { get: () => __map.size });
    return DuckWrapper;
}

function ducktor(ducks: Duck<any>[]): Ducktor {
    let __ducks = ducks;
    const DucktorWrapper: any = (query: DucktorQuery): Ducktor => {
        const result: Duck<any>[] = [];
        if (query === '*') {
            __ducks.forEach(d => d.forEach(nested => result.push(nested)));
        } else if (typeof query === 'function') {
            __ducks.forEach((d, index) => d.forEach((nested, key) => {
                if (query(key, d, index)) {
                    result.push(nested)
                }
            }));
        } else {
            __ducks.forEach(d => result.push(d(query)));
        }
        return ducktor(result);
    };
    DucktorWrapper.at = (index: number): Duck<any> => __ducks[index];
    DucktorWrapper.toDuck = (): Duck<any> => duckFrom(__ducks);
    DucktorWrapper.toObject = (): any[] => __ducks.map(d => d.toObject());
    return DucktorWrapper;
}

export function duckFrom(item: any): Duck<any> {
    if (isDuck(item)) {
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
