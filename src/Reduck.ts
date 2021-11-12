import { removeFromArray, isReduck } from './util';
import {
    Reactive,
    ReactiveCondition,
    ReactiveUpdater,
    Rule,
    Unsubscriber,
} from './Reactive';

export type ReducktorFuncQuery = (key: any, parent: Reduck<any>, index: number) => boolean;
export type ReducktorQuery = '*' | ReducktorFuncQuery | string | number;
export type ReduckListener = (ev: ReduckEvent) => void;
export type ReduckType<T> = T | Reactive<T> | Reduck<T>;
export type ReduckOperation = 'update' | 'insert' | 'delete';
export interface NodeReduck<T> {
    value: T;
    array: NodeReduck<T>[];
    map: any;
}
export interface Reducktor {
    (query: ReducktorQuery): Reducktor;
    at(index: number): Reduck<any>;
    toDeafReduck(): Reduck<any>;
    toObject(): any[];
}
export interface ReduckEvent {
    operation: ReduckOperation;
    key: any;
    items: Reduck<any>[];
    cancel: () => void;
    bubbles: Reduck<any>[];
}
export interface Reduck<T> {
    (key: any): Reduck<T>;
    value: T;
    type: string;
    reactive: Reactive<T>;
    forEach(callback: (reduck: Reduck<T>, key: any) => void): void;
    query(query: ReducktorQuery): Reducktor;
    toArray(): T[];
    toMap(): Map<any, T>;
    toObject(mapper?: WeakMap<Reduck<T>, any>): any;
    toNodeReduck(mapper?: WeakMap<Reduck<T>, NodeReduck<T>>): NodeReduck<T>;
    // Reduck Operation
    intelligentInsert(key: any, values: any[], silent?: boolean): void;
    intelligentDelete(key: any, deleted?: number, silent?: boolean): void;
    triggerListeners(operation: ReduckOperation, key: any, ...items: Reduck<any>[]): void;
    allowBubble(allow?: boolean): void;
    addParent(parent: Reduck<T>): void;
    removeParent(parent: Reduck<T>): void;
    onUpdate(callback: ReduckListener): Unsubscriber;
    onInsert(callback: ReduckListener): Unsubscriber;
    onDelete(callback: ReduckListener): Unsubscriber;
    // Reactive Operation
    setRule(rule: Rule<T>, ...subscriptions: Reactive<any>[]): void;
    allowDuplicate(allow?: boolean): void;
    onChange(callback: ReactiveUpdater<T>, immediateCall?: boolean): Unsubscriber;
    when(condition: ReactiveCondition<T>, callback: ReactiveUpdater<T>): Unsubscriber;
    bindValue(obj: any, param: string, decorator?: (value?: T) => any): Unsubscriber;
    // Array Operation
    length: number;
    push(...args: ReduckType<T>[]): number;
    pop(): Reduck<T> | undefined;
    shift(): Reduck<T> | undefined;
    unshift(...args: ReduckType<T>[]): number;
    splice(start: number, deleteCount?: number, ...args: ReduckType<T>[]): Reduck<T>[];
    // Map Operation
    size: number;
    set(key: any, value: T): Reduck<T>;
    get(key: any): T | undefined;
    clear(): void;
    delete(key: any): boolean;
    has(key: any): boolean;
}

const parseReduck = (d: any): Reduck<any> => isReduck(d) ? d : reduck(d);

export function reduck<T>(initial?: T | Reactive<T>, listenChilds: boolean = true): Reduck<T> {
    const __links: Reduck<T>[] = [];
    const __map: Map<any, Reduck<T>> = new Map();
    const __reactive: Reactive<T> = initial instanceof Reactive ? initial : new Reactive(initial);
    const __parents: Reduck<T>[] = [];
    const __updateListeners: ReduckListener[] = [];
    const __insertListeners: ReduckListener[] = [];
    const __deleteListeners: ReduckListener[] = [];
    let __allowBubble: boolean = true;
    const reduckClosure: any = (key: any): Reduck<T> => {
        if (key !== undefined) {
            const mapResult = __map.get(key);
            if (mapResult) {
                return mapResult;
            }
            const arrayResult = __links[key];
            return arrayResult;
        }
        return reduckWrapper;
    };
    const reduckWrapper: Reduck<any> = reduckClosure;
    // Reduck Operation
    reduckWrapper.intelligentInsert = (key: any, values: any[], silent: boolean = false) => {
        if (typeof key === 'number') {
            const items = values.map(parseReduck);
            __links.splice(key, 0, ...values);
            if (!silent) {
                reduckWrapper.triggerListeners('insert', key, ...items);
            }
        } else if (values.length) {
            const item = parseReduck(values[0]);
            __map.set(key, item);
            if (!silent) {
                reduckWrapper.triggerListeners('insert', key, item);
            }
        }
    };
    reduckWrapper.intelligentDelete = (key: any, deleted?: number, silent: boolean = false) => {
        if (typeof key === 'number') {
            if (deleted) {
                const items = __links.splice(key, deleted);
                if (!silent) {
                    reduckWrapper.triggerListeners('delete', key, ...items);
                }
            }
        } else {
            const item = __map.get(key);
            if (item) {
                reduckWrapper.delete(key);
                if (!silent) {
                    reduckWrapper.triggerListeners('delete', key, item);
                }
            }
        }
    };
    reduckWrapper.triggerListeners = (operation: ReduckOperation, key: any, ...items: Reduck<any>[]): void => {
        let cancelFlag = false;
        const reduckEvent: ReduckEvent = {
            operation,
            key,
            items,
            cancel: () => cancelFlag = true,
            bubbles: items.concat(reduckWrapper),
        };
        switch (operation) {
            case 'insert':
                for (const listener of __insertListeners) {
                    listener(reduckEvent);
                    if (cancelFlag) {
                        reduckWrapper.intelligentDelete(key, items.length, true);
                        return;
                    }
                }
                if (listenChilds) {
                    items.forEach(item => item.addParent(reduckWrapper));
                }
                break;
            case 'update':
                for (const listener of __updateListeners) {
                    listener(reduckEvent);
                    if (cancelFlag) {
                        return;
                    }
                }
                if (__allowBubble) {
                    __parents.forEach(item => {
                        if (!items.includes(item)) {
                            item.triggerListeners('update', key, ...reduckEvent.bubbles)
                        }
                    });
                }
                break;
            case 'delete':
                for (const listener of __deleteListeners) {
                    listener(reduckEvent);
                    if (cancelFlag) {
                        reduckWrapper.intelligentInsert(key, items, true);
                        return;
                    }
                }
                if (listenChilds) {
                    items.forEach(item => item.removeParent(reduckWrapper));
                }
                break;
        }
    };
    reduckWrapper.allowBubble = (allow: boolean = true) => {
        __allowBubble = allow;
    };
    reduckWrapper.addParent = (parent: Reduck<any>): void => {
        __parents.push(parent);
    };
    reduckWrapper.removeParent = (parent: Reduck<any>): void => {
        removeFromArray(parent, __parents);
    };
    reduckWrapper.onUpdate = (callback: ReduckListener): Unsubscriber => {
        __updateListeners.push(callback);
        return () => removeFromArray(callback, __updateListeners);
    };
    reduckWrapper.onInsert = (callback: ReduckListener): Unsubscriber => {
        __insertListeners.push(callback);
        return () => removeFromArray(callback, __insertListeners);
    };
    reduckWrapper.onDelete = (callback: ReduckListener): Unsubscriber => {
        __deleteListeners.push(callback);
        return () => removeFromArray(callback, __deleteListeners);
    };
    // Reactive Override
    reduckWrapper.setRule = (rule: Rule<T>, ...subscriptions: Reactive<any>[]): void => {
        __reactive.setRule(rule, ...subscriptions);
    };
    reduckWrapper.allowDuplicate = (allow?: boolean): void => {
        __reactive.allowDuplicate(allow);
    };
    reduckWrapper.onChange = (callback: ReactiveUpdater<T>, immediateCall?: boolean): Unsubscriber => {
        return __reactive.onChange(callback, immediateCall);
    };
    reduckWrapper.when = (condition: ReactiveCondition<T>, callback: ReactiveUpdater<T>): Unsubscriber => {
        return __reactive.when(condition, callback);
    };
    reduckWrapper.bindValue = (obj: any, param: string, decorator?: (value?: T) => any): Unsubscriber => {
        return __reactive.bindValue(obj, param, decorator);
    };
    // Array Override
    reduckWrapper.push = (...args: ReduckType<T>[]): number => {
        const newItems = args.map(parseReduck);
        const index = __links.length;
        const result = __links.push(...newItems);
        reduckWrapper.triggerListeners('insert', index, ...newItems);
        return result;
    };
    reduckWrapper.pop = (): Reduck<T> | undefined => {
        const deleted = __links.pop();
        if (deleted) {
            reduckWrapper.triggerListeners('delete', __links.length, deleted);
        }
        return deleted;
    };
    reduckWrapper.shift = (): Reduck<T> | undefined => {
        const deleted = __links.shift();
        if (deleted) {
            reduckWrapper.triggerListeners('delete', 0, deleted);
        }
        return deleted;
    };
    reduckWrapper.unshift = (...args: T[]): number => {
        const newItems = args.map(parseReduck);
        const result = __links.unshift(...newItems);
        reduckWrapper.triggerListeners('insert', 0, ...newItems);
        return result;
    }
    reduckWrapper.splice = (start: number, deleteCount: number = 0, ...args: ReduckType<T>[]): Reduck<T>[] => {
        const newItems = args.map(parseReduck);
        const maxIndex = __links.length;
        const deleted = __links.splice(start, deleteCount, ...newItems);
        const index = start > maxIndex ? maxIndex : start;
        if (newItems.length) {
            reduckWrapper.triggerListeners('insert', index, ...newItems);
        }
        if (deleted.length) {
            reduckWrapper.triggerListeners('delete', index, ...deleted);
        }
        return deleted;
    };
    // Map Override
    reduckWrapper.set = (key: any, value: T): Reduck<T> => {
        if (__map.has(key)) {
            __map.get(key)!.value = value;
        } else {
            const inserted = parseReduck(value);
            __map.set(key, inserted);
            reduckWrapper.triggerListeners('insert', key, inserted);
        }
        return reduckWrapper;
    };
    reduckWrapper.get = (key: any): T | undefined => {
        const fetchDuck = __map.get(key);
        return fetchDuck ? fetchDuck.value : undefined;
    };
    reduckWrapper.clear = (): void => {
        __map.clear();
        __map.forEach((value, key) => reduckWrapper.triggerListeners('delete', key, value));
    };
    reduckWrapper.delete = (key: any): boolean => {
        const item = __map.get(key);
        let result = false;
        if (item) {
            result = __map.delete(key);
            reduckWrapper.triggerListeners('delete', key, item);
        }
        return result;
    };
    reduckWrapper.has = (key: any): boolean => __map.has(key);
    // Unducking
    reduckWrapper.toArray = (): T[] => {
        return __links.map(d => d.value)
    };
    reduckWrapper.toMap = (): Map<any, T> => {
        const map = new Map();
        __map.forEach((d, key) => map.set(key, d.value));
        return map;
    };
    reduckWrapper.toObject = (mapper: WeakMap<Reduck<T>, any> = new WeakMap()): any => {
        let result: any;
        const res = mapper.get(reduckWrapper);
        if (res) {
            result = res;
        } else {
            if (__map.size) {
                result = {};
                mapper.set(reduckWrapper, result);
                __map.forEach((d, key) => result[key] = d.toObject(mapper));
            } else if (__links.length) {
                result = [];
                mapper.set(reduckWrapper, result);
                __links.forEach(d => result.push(d.toObject(mapper)));
            } else {
                result = reduckWrapper.value;
                mapper.set(reduckWrapper, result);
            }
        }
        return result;
    };
    reduckWrapper.toNodeReduck = (mapper: WeakMap<Reduck<T>, NodeReduck<T>> = new WeakMap()): NodeReduck<T> => {
        let node: NodeReduck<T>;
        const res = mapper.get(reduckWrapper);
        if (res) {
            node = res;
        } else {
            node = {
                value: reduckWrapper.value,
                array: [],
                map: {},    
            }
            mapper.set(reduckWrapper, node);
            __links.forEach(rd => {
                node.array.push(rd.toNodeReduck(mapper));
            });
            __map.forEach((rd, key) => {
                node.map[key] = rd.toNodeReduck(mapper);
            });
        }
        return node;
    }
    // Properties
    reduckWrapper.forEach = (callback: (duck: Reduck<T>, key: any) => void) => {
        __links.forEach((duck, index) => callback(duck, index));
        __map.forEach((duck, key) => callback(duck, key));
    };
    reduckWrapper.query = (query: ReducktorQuery): Reducktor => {
        const result: Reduck<any>[] = [];
        if (query === '*') {
            reduckWrapper.forEach((d: Reduck<T>) => result.push(d));
        } else if (typeof query === 'function') {
            reduckWrapper.forEach((d: Reduck<T>, key: any) => {
                if (query(key, reduckWrapper, 0)) {
                    result.push(d);
                }
            });
        } else {
            result.push(reduckWrapper(query));
        }
        return reducktor(result);
    };
    Object.defineProperty(reduckWrapper, 'value', {
        get: (): T => __reactive.value,
        set: (value: T) => __reactive.value = value,
    });
    Object.defineProperty(reduckWrapper, 'reactive', { get: () => __reactive });
    Object.defineProperty(reduckWrapper, 'length', { get: () => __links.length });
    Object.defineProperty(reduckWrapper, 'size', { get: () => __map.size });
    Object.defineProperty(reduckWrapper, 'type', { get: () => 'reduck' });
    __reactive.onChange(_ => reduckWrapper.triggerListeners('update', undefined));
    return reduckWrapper;
}

function reducktor(reducks: Reduck<any>[]): Reducktor {
    let __reducks = reducks;
    const reducktorClosure: any = (query: ReducktorQuery): Reducktor => {
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
    const reducktorWrapper: Reducktor = reducktorClosure;
    reducktorWrapper.at = (index: number): Reduck<any> => __reducks[index];
    reducktorWrapper.toDeafReduck = (): Reduck<any> => reduckFrom(__reducks, undefined, false);
    reducktorWrapper.toObject = (): any[] => __reducks.map(d => d.toObject());
    return reducktorWrapper;
}

export function reduckFrom(item: any, defaultValue?: any, listenChilds: boolean = true): Reduck<any> {
    if (isReduck(item)) {
        return item;
    } else if (item instanceof Reactive) {
        return reduck(item);
    }
    const d = reduck(defaultValue, listenChilds) as Reduck<any>;
    if (item instanceof Array) {
        item.forEach(value => d.push(reduckFrom(value, defaultValue)));
    } else if (item instanceof Map) {
        item.forEach((key, value) => d.set(key, reduckFrom(value, defaultValue)));
    } else if (typeof item === 'object') {
        for (const key in item) {
            d.set(key, reduckFrom(item[key], defaultValue));
        }
    } else {
        d.value = item;
    }
    return d;
}
