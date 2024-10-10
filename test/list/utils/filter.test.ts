import { describe, test, expect } from 'bun:test';
import { list, ReactiveList } from '../../../list';
import { randomList, randomNumber } from '../../test-util';
import { chainList, chainRawList } from '../list-util';

const evens = (list: ReactiveList<number>) => list.filter((item) => item % 2 === 0);
const rawEvens = (list: ReactiveList<number>) => list().filter((item) => item % 2 === 0);

describe('list-util filter', () => {
    test('initialize properly', () => {
        const l = list(randomList(10));
        const filtered = evens(l);

        expect(filtered()).toEqual(rawEvens(l));
    });

    test('filter properly after mutation', () => {
        const l = list([2, 3, 4, 6, 7, 9]);
        const filtered = evens(l);

        /**
         * inplace update
         * from [2, 4, 6]
         * into [10, 4, 6]
         */
        l(0, 10);
        /**
         * removed from filter by update
         * from [10, 4, 6]
         * into [10, 6]
         */
        l(2, 5);
        /**
         * inserted into filter by update
         * from [10, 6]
         * into [10, 6, 8]
         */
        l(4, 8);
        /**
         * inserted into filter
         * from [10, 6, 8]
         * into [10, 6, 8, 12]
         */
        l.push(12);
        /**
         * deleted from filter
         * from [10, 6, 8, 12]
         * into [6, 8, 12]
         */
        l.shift();

        expect(filtered()).toEqual(rawEvens(l));
    });

    test('wont update from filter directly', () => {
        const l = list(randomList(10));
        const filtered = evens(l);

        (filtered as any)(randomNumber(10), randomNumber(100));

        expect(filtered()).toEqual(rawEvens(l));
    });

    test('stop filtering', () => {
        const l = list(randomList(10));
        const filtered = evens(l);
        const oldFilter = [...filtered()];

        filtered.stop();
        const index = randomNumber(10);
        l(index, l(index) + 1);

        expect(filtered()).toEqual(oldFilter);
    });

    test('chain observed filter', () => {
        const l = list(randomList(10));
        const filtered = evens(l);
        const chained = chainList(filtered);

        expect(chained()).toEqual(chainRawList(rawEvens(l)));
    });

    test('properly stringified', () => {
        const l = list(randomList(10));
        const filtered = evens(l);

        expect(filtered.toString()).toBe(`FilteredList [ ${filtered().join(', ')} ]`);
    });
});
