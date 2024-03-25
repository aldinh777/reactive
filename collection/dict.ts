import { Watchable, watchify } from '../utils/watchable';

export interface DictObject<T> {
    [key: string]: T;
}

export interface RDict<T> extends Watchable<string, T> {
    (): T[];
    (key: string): T;
    (key: string, value: T): RDict<T>;
    delete(key: string): boolean;
    clear(): void;
}

export function dict<T>(initial: DictObject<T> | Map<string, T> = new Map()) {
    const isMap = initial instanceof Map;
    const raw = isMap ? initial : new Map<string, T>();
    if (!isMap) {
        for (const key in initial) {
            raw.set(key, initial[key]);
        }
    }
    const RDict = (...arg: [string?, T?]) => {
        if (!arg.length) {
            return raw;
        }
        const [key, value] = arg;
        if (arg.length === 1) {
            return raw.get(key);
        }
        const op = raw.has(key) ? '=' : '+';
        const prev = raw.get(key);
        raw.set(key, value);
        trigger(op, key, value, prev);
        return RDict;
    };
    const trigger = watchify(RDict);
    RDict.delete = (key: string): boolean => {
        const item = raw.get(key);
        const result = raw.delete(key);
        if (result) {
            trigger('-', key, item as T);
        }
        return result;
    };
    RDict.clear = (): void => {
        const items = Array.from(raw.entries());
        raw.clear();
        for (const [key, deleted] of items) {
            trigger('-', key, deleted);
        }
    };
    return RDict as RDict<T>;
}
