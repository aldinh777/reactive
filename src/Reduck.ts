import { removeFromArray, isReduck } from './util';
import { DucktorQuery } from './Duck';
import {
    Reactive,
    ReactiveCondition,
    ReactiveUpdater,
    Rule,
    Unsubscriber,
} from './Reactive';

export interface Reduck<T> {
    (key: any): Reduck<T>;
    value: T;
    type: string;
    forEach(callback: (duck: Reduck<T>, key: any) => void): void;
    query(query: any): Reducktor;
    toArray(): T[];
    toMap(): Map<any, T>;
    toObject(): any;

    triggerListeners(operation: Operation, key: any, ...items: Reduck<any>[]): void;
    allowBubble(allow?: boolean): void;
    addParent(parent: Reduck<T>): void;
    removeParent(parent: Reduck<T>): void;
    onUpdate(callback: ReduckListener): Unsubscriber;
    onInsert(callback: ReduckListener): Unsubscriber;
    onDelete(callback: ReduckListener): Unsubscriber;

    setRule(rule: Rule<T>, ...subscriptions: Reactive<any>[]): void;
    allowDuplicate(allow?: boolean): void;
    onChange(callback: ReactiveUpdater<T>, immediateCall?: boolean): Unsubscriber;
    when(condition: ReactiveCondition<T>, callback: ReactiveUpdater<T>): Unsubscriber;
    bindValue(obj: any, param: string, decorator?: (value?: T) => any): Unsubscriber;

    length: number;
    push(...args: ReduckType<T>[]): number;
    pop(): Reduck<T> | undefined;
    shift(): number;
    unshift(...args: ReduckType<T>[]): Reduck<T> | undefined;
    splice(start: number, deleteCount?: number, ...args: ReduckType<T>[]): Reduck<T>[];

    size: number;
    set(key: any, value: T): Reduck<T>;
    get(key: any): T | undefined;
    clear(): void;
    delete(key: any): boolean;
    has(key: any): boolean;
}
export interface Reducktor {
    (query: DucktorQuery): Reducktor;
    at(index: number): Reduck<any>;
    toReduck(): Reduck<any>;
    toObject(): any[];
}
export type ReduckListener = (key: any, ...items: Reduck<any>[]) => void;
export type ReduckUpdateListener = (...items: Reduck<any>[]) => void;
export type ReduckType<T> = T | Reactive<T> | Reduck<T>;
type Operation = 'update' | 'insert' | 'delete';

const parseReduck = (d: any): Reduck<any> => isReduck(d) ? d : reduck(d);

export function reduck<T>(initial?: T | Reactive<T>, listenChilds: boolean = true): Reduck<T> {
    const __links: Reduck<T>[] = [];
    const __map: Map<any, Reduck<T>> = new Map();
    const __reactive: Reactive<T> = initial instanceof Reactive ? initial : new Reactive(initial);
    const __parents: Reduck<T>[] = [];
    const __updateListeners: ReduckUpdateListener[] = [];
    const __insertListeners: ReduckListener[] = [];
    const __deleteListeners: ReduckListener[] = [];
    let __allowBubble: boolean = true;
    const ReduckWrapper: any = (key: any): Reduck<T> => {
        if (key !== undefined) {
            const mapResult = __map.get(key);
            if (mapResult) {
                return mapResult;
            }
            const arrayResult = __links[key];
            return arrayResult;
        }
        return ReduckWrapper;
    };
    // Reactive Reduck Operation
    ReduckWrapper.triggerListeners = (operation: Operation, key: any, ...items: Reduck<any>[]): void => {
        switch (operation) {
            case 'insert':
                __insertListeners.forEach(listener => listener(key, ...items));
                if (listenChilds) {
                    items.forEach(item => item.addParent(ReduckWrapper));
                }
                break;
            case 'update':
                const bubbles = items.concat(ReduckWrapper);
                __updateListeners.forEach(listener => listener(...bubbles));
                if (__allowBubble) {
                    __parents.forEach(item => {
                        if (!items.includes(item)) {
                            item.triggerListeners('update', key, ...bubbles)
                        }
                    });
                }
                break;
            case 'delete':
                __deleteListeners.forEach(listener => listener(key, ...items));
                if (listenChilds) {
                    items.forEach(item => item.removeParent(ReduckWrapper));
                }
                break;
        }
    };
    ReduckWrapper.allowBubble = (allow: boolean = true) => {
        __allowBubble = allow;
    };
    ReduckWrapper.addParent = (parent: Reduck<any>): void => {
        __parents.push(parent);
    };
    ReduckWrapper.removeParent = (parent: Reduck<any>): void => {
        removeFromArray(parent, __parents);
    };
    ReduckWrapper.onUpdate = (callback: ReduckUpdateListener): Unsubscriber => {
        __updateListeners.push(callback);
        return () => removeFromArray(callback, __updateListeners);
    };
    ReduckWrapper.onInsert = (callback: ReduckListener): Unsubscriber => {
        __insertListeners.push(callback);
        return () => removeFromArray(callback, __insertListeners);
    };
    ReduckWrapper.onDelete = (callback: ReduckListener): Unsubscriber => {
        __deleteListeners.push(callback);
        return () => removeFromArray(callback, __deleteListeners);
    };
    // Reactive Override
    ReduckWrapper.setRule = (rule: Rule<T>, ...subscriptions: Reactive<any>[]): void => {
        __reactive.setRule(rule, ...subscriptions);
    };
    ReduckWrapper.allowDuplicate = (allow?: boolean): void => {
        __reactive.allowDuplicate(allow);
    };
    ReduckWrapper.onChange = (callback: ReactiveUpdater<T>, immediateCall?: boolean): Unsubscriber => {
        return __reactive.onChange(callback, immediateCall);
    };
    ReduckWrapper.when = (condition: ReactiveCondition<T>, callback: ReactiveUpdater<T>): Unsubscriber => {
        return __reactive.when(condition, callback);
    };
    ReduckWrapper.bindValue = (obj: any, param: string, decorator?: (value?: T) => any): Unsubscriber => {
        return __reactive.bindValue(obj, param, decorator);
    };
    // Array Override
    ReduckWrapper.push = (...args: ReduckType<T>[]): number => {
        const newItems = args.map(parseReduck);
        ReduckWrapper.triggerListeners('insert', __links.length, ...newItems);
        return __links.push(...newItems);
    };
    ReduckWrapper.pop = (): Reduck<T> | undefined => {
        const deleted = __links.pop();
        if (deleted) {
            ReduckWrapper.triggerListeners('delete', __links.length, deleted);
        }
        return deleted;
    };
    ReduckWrapper.shift = (): Reduck<T> | undefined => {
        const deleted = __links.shift();
        if (deleted) {
            ReduckWrapper.triggerListeners('delete', 0, deleted);
        }
        return deleted;
    };
    ReduckWrapper.unshift = (...args: T[]): number => {
        const newItems = args.map(parseReduck);
        ReduckWrapper.triggerListeners('insert', 0, ...newItems);
        return __links.unshift(...newItems);
    }
    ReduckWrapper.splice = (start: number, deleteCount: number = 0, ...args: ReduckType<T>[]): Reduck<T>[] => {
        const newItems = args.map(parseReduck);
        const deleted = __links.splice(start, deleteCount, ...newItems);
        if (newItems.length) {
            ReduckWrapper.triggerListeners('insert', start, ...newItems);
        }
        if (deleted.length) {
            ReduckWrapper.triggerListeners('delete', start, ...deleted);
        }
        return deleted;
    };
    // Map Override
    ReduckWrapper.set = (key: any, value: T): Reduck<T> => {
        if (__map.has(key)) {
            __map.get(key)!.value = value;
        } else {
            const inserted = parseReduck(value);
            ReduckWrapper.triggerListeners('insert', key, inserted);
            __map.set(key, inserted);
        }
        return ReduckWrapper;
    };
    ReduckWrapper.get = (key: any): T | undefined => {
        const fetchDuck = __map.get(key);
        return fetchDuck ? fetchDuck.value : undefined;
    };
    ReduckWrapper.clear = (): void => {
        __map.forEach((value, key) => ReduckWrapper.triggerListeners('delete', key, value));
        __map.clear()
    };
    ReduckWrapper.delete = (key: any): boolean => {
        const item = __map.get(key);
        if (item) {
            item.removeParent(ReduckWrapper);
            ReduckWrapper.triggerListeners('delete', key, item);
        }
        return __map.delete(key);
    };
    ReduckWrapper.has = (key: any): boolean => __map.has(key);
    // Unducking
    ReduckWrapper.toArray = (): T[] => {
        return __links.map(d => d.value)
    };
    ReduckWrapper.toMap = (): Map<any, T> => {
        const map = new Map();
        __map.forEach((d, key) => map.set(key, d.value));
        return map;
    };
    ReduckWrapper.toObject = (): any => {
        if (__map.size) {
            const result: any = {};
            __map.forEach((d, key) => result[key] = d.toObject());
            return result;
        } else if (__links.length) {
            return __links.map(d => d.toObject());
        } else {
            return ReduckWrapper.value;
        }
    };
    // Properties
    ReduckWrapper.forEach = (callback: (duck: Reduck<T>, key: any) => void) => {
        __links.forEach((duck, index) => callback(duck, index));
        __map.forEach((duck, key) => callback(duck, key));
    };
    ReduckWrapper.query = (query: DucktorQuery): Reducktor => {
        const result: Reduck<any>[] = [];
        if (query === '*') {
            ReduckWrapper.forEach((d: Reduck<T>) => result.push(d));
        } else if (typeof query === 'function') {
            ReduckWrapper.forEach((d: Reduck<T>, key: any) => {
                if (query(key, ReduckWrapper, 0)) {
                    result.push(d);
                }
            });
        } else {
            result.push(ReduckWrapper(query));
        }
        return reducktor(result);
    };
    Object.defineProperty(ReduckWrapper, 'value', {
        get: (): T => __reactive.value,
        set: (value: T) => {
            __reactive.value = value;
            ReduckWrapper.triggerListeners('update', undefined);
        },
    });
    Object.defineProperty(ReduckWrapper, 'length', { get: () => __links.length });
    Object.defineProperty(ReduckWrapper, 'size', { get: () => __map.size });
    Object.defineProperty(ReduckWrapper, 'type', { get: () => 'reduck' });
    return ReduckWrapper;
}

function reducktor(reducks: Reduck<any>[]): Reducktor {
    let __reducks = reducks;
    const ReducktorWrapper: any = (query: any): Reducktor => {
        const result: Reduck<any>[] = [];
        if (query === '*') {
            __reducks.forEach(d => d.forEach(nested => result.push(nested)));
        } else if (typeof query === 'function') {
            __reducks.forEach((d, index) => d.forEach((nested, key) => {
                if (query(key, d, index)) {
                    result.push(nested)
                }
            }));
        } else {
            __reducks.forEach(d => result.push(d(query)));
        }
        return reducktor(result);
    };
    ReducktorWrapper.at = (index: number): Reduck<any> => __reducks[index];
    ReducktorWrapper.toReduck = (): Reduck<any> => reduckFrom(__reducks, false);
    ReducktorWrapper.toObject = (): any[] => __reducks.map(d => d.toObject());
    return ReducktorWrapper;
}

export function reduckFrom(item: any, listenChilds: boolean = true): Reduck<any> {
    if (isReduck(item)) {
        return item;
    } else if (item instanceof Reactive) {
        return reduck(item);
    }
    const d = reduck(undefined, listenChilds) as Reduck<any>;
    if (item instanceof Array) {
        item.forEach(value => d.push(reduckFrom(value)));
    } else if (item instanceof Map) {
        item.forEach((key, value) => d.set(key, reduckFrom(value)));
    } else if (typeof item === 'object') {
        for (const key in item) {
            d.set(key, reduckFrom(item[key]));
        }
    } else {
        d.value = item;
    }
    return d;
}
