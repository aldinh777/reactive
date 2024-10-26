import type { ReactiveList } from '../../list/index.ts';
import { describe, test, expect } from 'bun:test';
import { list } from '../../list/index.ts';
import { randomList, randomNumber } from '../test-util.ts';
import { chainList, chainRawList } from '../list-util.ts';

const addOne = (list: ReactiveList<number>) => list.map((item) => item + 1);
const rawAddOne = (list: ReactiveList<number>) => list().map((item) => item + 1);

describe('list-util map', () => {
    test('initialize properly', () => {
        const l = list(randomList(10));
        const mapped = addOne(l);

        expect(mapped()).toEqual(rawAddOne(l));
    });

    test('map properly after mutation', () => {
        const l = list(randomList(100));
        const mapped = addOne(l);

        const index = randomNumber(10);
        l(index, l(index) + 1);
        l.push(randomNumber(100));
        l.shift();
        l.splice(index, 1, randomNumber(10));

        expect(mapped()).toEqual(rawAddOne(l));
    });

    test('wont update from map directly', () => {
        const l = list(randomList(10));
        const mapped = addOne(l);

        (mapped as any)(randomNumber(10), randomNumber(100));

        expect(mapped()).toEqual(rawAddOne(l));
    });

    test('chain observed map', () => {
        const l = list(randomList(10));
        const mapped = addOne(l);
        const chained = chainList(mapped);

        expect(chained()).toEqual(chainRawList(rawAddOne(l)));
    });

    test('properly stringified', () => {
        const l = list(randomList(10));
        const mapped = addOne(l);

        expect(mapped.toString()).toBe(`MappedList [ ${mapped().join(', ')} ]`);
    });
});
