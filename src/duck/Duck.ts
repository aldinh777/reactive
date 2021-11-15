import { isDuck } from '../util';

export type DuckType<T> = T | Duck<T>;
export type DucktorFuncQuery = (key: any, parent: Duck<any>, index: number) => boolean;
export type DucktorQuery = '*' | DucktorFuncQuery | string | number;
export interface NodeDuck<T> {
    value: T;
    array: NodeDuck<T>[];
    map: any;
}
export interface Ducktor {
    (query: DucktorQuery): Ducktor;
    at(index: number): Duck<any>;
    toDuck(): Duck<any>;
    toObject(): any;
}
export interface Duck<T> {
    (key: any): Duck<T>;
    value: T;
    type: string;
    forEach(callback: (duck: Duck<T>, key: any) => void): void;
    query(query: DucktorQuery): Ducktor;
    toArray(): T[];
    toMap(): Map<any, T>;
    toObject(mapper?: WeakMap<Duck<T>, any>): any;
    toNodeDuck(mapper?: WeakMap<Duck<T>, NodeDuck<T>>): NodeDuck<T>;
    // Array Operation
    length: number;
    push(...args: DuckType<T>[]): number;
    pop(): Duck<T> | undefined;
    shift(): Duck<T> | undefined;
    unshift(...args: DuckType<T>[]): number;
    splice(start: number, deleteCount?: number, ...args: DuckType<T>[]): Duck<T>[];
    // Map Operation
    size: number;
    set(key: any, value: T): Duck<T>;
    get(key: any): T | undefined;
    clear(): void;
    delete(key: any): boolean;
    has(key: any): boolean;
}

const parseDuck = (d: any): Duck<any> => isDuck(d) ? d : duck(d);

export function duck<T>(initial?: T): Duck<T> {
    const __links: Duck<T>[] = [];
    const __map: Map<any, Duck<T>> = new Map();
    let __value: T = initial as T;
    const duckClosure: any = (key: any): Duck<T> => {
        if (key !== undefined) {
            const mapResult = __map.get(key);
            if (mapResult) {
                return mapResult;
            }
            const arrayResult = __links[key];
            return arrayResult;
        }
        return duckWrapper;
    }
    const duckWrapper: Duck<T> = duckClosure;
    // Array Override
    duckWrapper.push = (...args: DuckType<T>[]): number => __links.push(...args.map(parseDuck));
    duckWrapper.pop = (): Duck<T> | undefined => __links.pop();
    duckWrapper.shift = (): Duck<T> | undefined => __links.shift();
    duckWrapper.unshift = (...args: T[]): number => __links.unshift(...args.map(parseDuck));
    duckWrapper.splice = (start: number, deleteCount: number = 0, ...args: DuckType<T>[]): Duck<T>[] => {
        return __links.splice(start, deleteCount, ...args.map(parseDuck));
    };
    // Map Override
    duckWrapper.set = (key: any, value: T): Duck<T> => {
        __map.set(key, parseDuck(value));
        return duckWrapper;
    };
    duckWrapper.get = (key: any): T | undefined => {
        const fetchDuck = __map.get(key)
        return fetchDuck ? fetchDuck.value : undefined;
    };
    duckWrapper.clear = (): void => __map.clear();
    duckWrapper.delete = (key: any): boolean => __map.delete(key);
    duckWrapper.has = (key: any): boolean => __map.has(key);
    // Unducking
    duckWrapper.toArray = (): T[] => {
        return __links.map(d => d.value)
    };
    duckWrapper.toMap = (): Map<any, T> => {
        const map = new Map();
        __map.forEach((d, key) => map.set(key, d.value));
        return map;
    }
    duckWrapper.toObject = (mapper: WeakMap<Duck<T>, any> = new WeakMap()): any => {
        let result: any;
        const res = mapper.get(duckWrapper);
        if (res) {
            result = res;
        } else {
            if (__map.size) {
                result = {};
                mapper.set(duckWrapper, result);
                __map.forEach((d, key) => result[key] = d.toObject(mapper));
            } else if (__links.length) {
                result = [];
                mapper.set(duckWrapper, result);
                __links.forEach(d => result.push(d.toObject(mapper)));
            } else {
                result = duckWrapper.value;
                mapper.set(duckWrapper, result);
            }
        }
        return result;
    }
    duckWrapper.toNodeDuck = (mapper: WeakMap<Duck<T>, NodeDuck<T>> = new WeakMap()): NodeDuck<T> => {
        let node: NodeDuck<T>;
        const res = mapper.get(duckWrapper);
        if (res) {
            node = res;
        } else {
            node = {
                value: duckWrapper.value,
                array: [],
                map: {},    
            }
            mapper.set(duckWrapper, node);
            __links.forEach(d => {
                node.array.push(d.toNodeDuck(mapper));
            });
            __map.forEach((d, key) => {
                node.map[key] = d.toNodeDuck(mapper);
            });
        }
        return node;
    }
    // Properties
    duckWrapper.forEach = (callback: (duck: Duck<T>, key: any) => void) => {
        __links.forEach((duck, index) => callback(duck, index));
        __map.forEach((duck, key) => callback(duck, key));
    };
    duckWrapper.query = (query: DucktorQuery): Ducktor => {
        const result: Duck<any>[] = [];
        if (query === '*') {
            duckWrapper.forEach((d: Duck<T>) => result.push(d));
        } else if (typeof query === 'function') {
            duckWrapper.forEach((d: Duck<T>, key: any) => {
                if (query(key, duckWrapper, 0)) {
                    result.push(d);
                }
            });
        } else {
            result.push(duckWrapper(query));
        }
        return ducktor(result);
    };
    Object.defineProperty(duckWrapper, 'value', {
        get: () => __value,
        set: (value) => __value = value,
    });
    Object.defineProperty(duckWrapper, 'type', { get: () => 'duck' });
    Object.defineProperty(duckWrapper, 'length', { get: () => __links.length });
    Object.defineProperty(duckWrapper, 'size', { get: () => __map.size });
    return duckWrapper;
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

export function duckFrom(item: any, defaultValue?: any): Duck<any> {
    if (isDuck(item)) {
        return item;
    }
    const d = duck(defaultValue);
    if (item instanceof Array) {
        item.forEach(value => d.push(duckFrom(value, defaultValue)));
    } else if (item instanceof Map) {
        item.forEach((key, value) => d.set(key, duckFrom(value, defaultValue)));
    } else if (typeof item === 'object') {
        for (const key in item) {
            const value = item[key];
            d.set(key, duckFrom(value, defaultValue));
        }
    } else {
        d.value = item;
    }
    return d;
}
