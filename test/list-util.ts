import type { WatchableList } from '@aldinh777/reactive/list';

export function chainList(list: WatchableList<number>): WatchableList<number> {
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
