import { removeFromArray, quack, canQuack } from './util';
import {
    Reactive,
    ReactiveCondition,
    ReactiveUpdater,
    Rule,
    Unsubscriber,
} from "./Reactive";

export type ReduckListener = (key: any, ...items: Reduck<any>[]) => Unsubscriber;
export type ReduckType<T> = T | Reactive<T> | Reduck<T>;
export interface Reduck<T> {
    (key: any): Reduck<T>;
    value: T;
    quack(): void;
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
};

type Operation = 'update' | 'insert' | 'delete';

const parseReduck = (d: any): Reduck<any> => canQuack(d) ? d : reduck(d);

export function reduck<T>(initial?: T | Reactive<T>): Reduck<T> {
    const __links: Reduck<T>[] = [];
    const __map: Map<any, Reduck<T>> = new Map();
    const __reactive: Reactive<T> = initial instanceof Reactive ? initial : new Reactive(initial);
    const __parents: Reduck<T>[] = [];
    const __updateListeners: ReduckListener[] = [];
    const __insertListeners: ReduckListener[] = [];
    const __deleteListeners: ReduckListener[] = [];
    let __allowBubble: boolean = true;
    const ReactiveDuck: any = (key: any): Reduck<T> => {
        if (key !== undefined) {
            const mapResult = __map.get(key);
            if (mapResult) {
                return mapResult;
            }
            const arrayResult = __links[key];
            return arrayResult;
        }
        return ReactiveDuck;
    };
    // Reactive Duck Operation
    ReactiveDuck.triggerListeners = (operation: Operation, key: any, ...items: Reduck<any>[]): void => {
        switch (operation) {
            case 'insert':
                __insertListeners.forEach(listener => listener(key, ...items));
                items.forEach(item => item.addParent(ReactiveDuck));
                break;
            case 'update':
                const bubbles = items.concat(ReactiveDuck);
                __updateListeners.forEach(listener => listener(key, ...bubbles));
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
                items.forEach(item => item.removeParent(ReactiveDuck));
                break;
        }
    };
    ReactiveDuck.allowBubble = (allow: boolean = true) => {
        __allowBubble = allow;
    };
    ReactiveDuck.addParent = (parent: Reduck<any>): void => {
        __parents.push(parent);
    };
    ReactiveDuck.removeParent = (parent: Reduck<any>): void => {
        removeFromArray(parent, __parents);
    };
    ReactiveDuck.onUpdate = (callback: ReduckListener): Unsubscriber => {
        __updateListeners.push(callback);
        return () => removeFromArray(callback, __updateListeners);
    };
    ReactiveDuck.onInsert = (callback: ReduckListener): Unsubscriber => {
        __insertListeners.push(callback);
        return () => removeFromArray(callback, __insertListeners);
    };
    ReactiveDuck.onDelete = (callback: ReduckListener): Unsubscriber => {
        __deleteListeners.push(callback);
        return () => removeFromArray(callback, __deleteListeners);
    };
    // Reactive Override
    ReactiveDuck.setRule = (rule: Rule<T>, ...subscriptions: Reactive<any>[]): void => {
        __reactive.setRule(rule, ...subscriptions);
    };
    ReactiveDuck.allowDuplicate = (allow?: boolean): void => {
        __reactive.allowDuplicate(allow);
    };
    ReactiveDuck.onChange = (callback: ReactiveUpdater<T>, immediateCall?: boolean): Unsubscriber => {
        return __reactive.onChange(callback, immediateCall);
    };
    ReactiveDuck.when = (condition: ReactiveCondition<T>, callback: ReactiveUpdater<T>): Unsubscriber => {
        return __reactive.when(condition, callback);
    };
    ReactiveDuck.bindValue = (obj: any, param: string, decorator?: (value?: T) => any): Unsubscriber => {
        return __reactive.bindValue(obj, param, decorator);
    };
    // Array Override
    ReactiveDuck.push = (...args: ReduckType<T>[]): number => {
        const newItems = args.map(parseReduck);
        ReactiveDuck.triggerListeners('insert', __links.length, ...newItems);
        return __links.push(...newItems);
    };
    ReactiveDuck.pop = (): Reduck<T> | undefined => {
        const deleted = __links.pop();
        if (deleted) {
            ReactiveDuck.triggerListeners('delete', __links.length, deleted);
        }
        return deleted;
    };
    ReactiveDuck.shift = (): Reduck<T> | undefined => {
        const deleted = __links.shift();
        if (deleted) {
            ReactiveDuck.triggerListeners('delete', 0, deleted);
        }
        return deleted;
    };
    ReactiveDuck.unshift = (...args: T[]): number => {
        const newItems = args.map(parseReduck);
        ReactiveDuck.triggerListeners('insert', 0, ...newItems);
        return __links.unshift(...newItems);
    }
    ReactiveDuck.splice = (start: number, deleteCount: number = 0, ...args: ReduckType<T>[]): Reduck<T>[] => {
        const newItems = args.map(parseReduck);
        const deleted = __links.splice(start, deleteCount, ...newItems);
        if (newItems.length) {
            ReactiveDuck.triggerListeners('insert', start, ...newItems);
        }
        if (deleted.length) {
            ReactiveDuck.triggerListeners('delete', start, ...deleted);
        }
        return deleted;
    };
    // Map Override
    ReactiveDuck.set = (key: any, value: T): Reduck<T> => {
        if (__map.has(key)) {
            __map.get(key)!.value = value;
        } else {
            const inserted = parseReduck(value);
            ReactiveDuck.triggerListeners('insert', key, inserted);
            __map.set(key, inserted);
        }
        return ReactiveDuck;
    };
    ReactiveDuck.get = (key: any): T | undefined => {
        const fetchDuck = __map.get(key);
        return fetchDuck ? fetchDuck.value : undefined;
    };
    ReactiveDuck.clear = (): void => {
        __map.forEach((value, key) => ReactiveDuck.triggerListeners('delete', key, value));
        __map.clear()
    };
    ReactiveDuck.delete = (key: any): boolean => {
        const item = __map.get(key);
        if (item) {
            item.removeParent(ReactiveDuck);
            ReactiveDuck.triggerListeners('delete', key, item);
        }
        return __map.delete(key);
    };
    ReactiveDuck.has = (key: any): boolean => __map.has(key);
    // Unducking
    ReactiveDuck.toArray = (): T[] => {
        return __links.map(d => d.value)
    };
    ReactiveDuck.toMap = (): Map<any, T> => {
        const map = new Map();
        __map.forEach((d, key) => map.set(key, d.value));
        return map;
    };
    ReactiveDuck.toObject = (): any => {
        if (__map.size) {
            const result: any = {};
            __map.forEach((d, key) => result[key] = d.toObject());
            return result;
        } else if (__links.length) {
            return __links.map(d => d.toObject());
        } else {
            return ReactiveDuck.value;
        }
    };
    // Properties
    ReactiveDuck.quack = (...args: any[]): void => quack(...args);
    Object.defineProperty(ReactiveDuck, 'value', {
        get: (): T => __reactive.value,
        set: (value: T) => {
            __reactive.value = value;
            ReactiveDuck.triggerListeners('update', undefined);
        },
    });
    Object.defineProperty(ReactiveDuck, 'length', { get: () => __links.length });
    Object.defineProperty(ReactiveDuck, 'size', { get: () => __map.size });
    return ReactiveDuck;
}

export function reduckFrom(item: any): Reduck<any> {
    if (canQuack(item)) {
        return item;
    }
    const d = reduck();
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
