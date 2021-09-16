export type DinoFunction = (...args: any[]) => any;
export type SpinoFunction = (...args: any[]) => Promise<any>;

export function dino(fun: (...args: any[]) => any) :DinoFunction {
    const results = new Map();
    return function(...args: any[]) {
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

export function spino(fun: (...args: any[]) => any) :SpinoFunction {
    const results = new Map();
    return async function(...args: any[]) {
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
        const _ = await Promise.resolve();
        const result = fun(...args, lastarg);
        map.set(lastarg, result);
        return result;
    }
}
