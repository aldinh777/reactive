import type { WatchableList } from '@aldinh777/reactive/list';
import { describe, test, expect } from 'bun:test';
import { list } from '@aldinh777/reactive/list';
import { randomList, randomNumber } from '../test-util';
import { chainList, chainRawList } from '../list-util';

const addOne = (list: WatchableList<number>) => list.map((item) => item + 1);
const rawAddOne = (list: WatchableList<number>) => list.toArray().map((item) => item + 1);

describe('list-util map', () => {
  test('initialize properly', () => {
    const l = list(randomList(10));
    const mapped = addOne(l);

    expect(mapped.toArray()).toEqual(rawAddOne(l));
  });

  test('watch update', () => {
    const l = list([2, 3, 4, 5]);
    const mapped = addOne(l);

    let updateCounter = 0;
    const unsubUpdate = mapped.onUpdate(() => updateCounter++);
    l.set(0, 3); // updateCounter = 1
    expect(updateCounter).toBe(1);

    let insertCounter = 0;
    const unsubInsert = mapped.onInsert(() => insertCounter++);
    l.push(6); // insertCounter = 1
    expect(insertCounter).toBe(1);

    let deleteCounter = 0;
    const unsubDelete = mapped.onDelete(() => deleteCounter++);
    l.pop(); // deleteCounter = 1
    expect(deleteCounter).toBe(1);

    // ensure mapped still up to date with l, also to fulfill coverage
    expect(mapped.toArray()).toEqual(rawAddOne(l));
    expect(mapped.at(0)).toBe(l.at(0) + 1);

    unsubUpdate();
    l.set(0, 2);
    expect(updateCounter).toBe(1);

    unsubInsert();
    l.push(6);
    expect(insertCounter).toBe(1);

    unsubDelete();
    l.pop();
    expect(deleteCounter).toBe(1);
  });

  test('map properly after mutation', () => {
    const l = list(randomList(100));
    const mapped = addOne(l);

    const index = randomNumber(10);
    l.set(index, l.at(index) + 1);
    l.push(randomNumber(100));
    l.shift();
    l.splice(index, 1, randomNumber(10));

    expect(mapped.toArray()).toEqual(rawAddOne(l));
  });

  test('chain observed map', () => {
    const l = list(randomList(10));
    const mapped = addOne(l);
    const chained = chainList(mapped);

    expect(chained.toArray()).toEqual(chainRawList(rawAddOne(l)));
  });
});
