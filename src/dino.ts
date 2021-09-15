export type DinoFunction = (...args: any[]) => any;

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
