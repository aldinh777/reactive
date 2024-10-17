import type { ObservedList } from '../common/watchable.ts';

export function chainList(list: ObservedList<number>): ObservedList<number> {
    return list
        .filter((item) => item > 10)
        .map((item) => item * 2)
        .sort((a, b) => a > b);
}

export function chainRawList(list: number[]): number[] {
    return list
        .filter((item) => item > 10)
        .map((item) => item * 2)
        .sort((a, b) => b - a);
}
