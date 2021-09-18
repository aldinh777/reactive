export type DinoFunction<T> = (...args: any[]) => T;
export type SpinoFunction<T> = (...args: any[]) => Promise<T>;

export function dino<T>(fun: (...args: any[]) => T) :DinoFunction<T> {
    const results = new Map();
    return function(...args: any[]) :T {
        let lastarg = args.pop();
        let map = results;
        for (const arg of args) {
            if (!map.has(arg)) {
                const nextmap = new Map();
                map.set(arg, nextmap);
                map = nextmap;
            }
        }
        if (map.has(lastarg)) {
            return map.get(lastarg);
        }
        const result = fun(...args, lastarg);
        map.set(lastarg, result);
        return result;
    }
}

export function spino<T>(fun: (...args: any[]) => Promise<T>) :SpinoFunction<T> {
    const results = new Map();
    return async function(...args: any[]) :Promise<T> {
        let lastarg = args.pop();
        let map = results;
        for (const arg of args) {
            if (!map.has(arg)) {
                const nextmap = new Map();
                map.set(arg, nextmap);
                map = nextmap;
            }
        }
        if (map.has(lastarg)) {
            return map.get(lastarg);
        }
        const result = await Promise.resolve([...args, lastarg]).then(fun);
        map.set(lastarg, result);
        return result;
    }
}
