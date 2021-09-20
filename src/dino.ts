export type DinoFunction<T> = (...args: any[]) => T|Promise<T>;

export function dino<T>(fun: (...args: any[]) => T): DinoFunction<T> {
    const results = new Map();
    return function (...args: any[]): T|Promise<T> {
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
        if (result instanceof Promise) {
            return Promise.resolve()
                .then(() => result)
                .then(res => {
                    map.set(lastarg, res);
                    return res;
                });
        } else {
            map.set(lastarg, result);
            return result;
        }
    }
}
