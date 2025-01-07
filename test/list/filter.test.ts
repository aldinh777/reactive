import type { WatchableList } from '../../list/common.ts';
import { describe, test, expect } from 'bun:test';
import { list } from '../../list/index.ts';
import { randomList, randomNumber } from '../test-util.ts';
import { chainList, chainRawList } from '../list-util.ts';

const evens = (list: WatchableList<number>) => list.filter((item) => item % 2 === 0);
const rawEvens = (list: WatchableList<number>) => list().filter((item) => item % 2 === 0);

describe('list-util filter', () => {
    test('initialize properly', () => {
        const l = list(randomList(10));
        const filtered = evens(l);

        expect(filtered()).toEqual(rawEvens(l));
    });

    test('watch update', () => {
        const l = list([2, 3, 4, 5]);
        const filtered = evens(l);

        let updateCounter = 0;
        const unsubUpdate = filtered.onUpdate(() => updateCounter++);
        l(0, 4); // updateCounter = 1
        l(1, 5); // updateCounter still 1, l[1] is 3 which is odd
        expect(updateCounter).toBe(1);

        let insertCounter = 0;
        const unsubInsert = filtered.onInsert(() => insertCounter++);
        l(1, 6); // 5 to 6 which is even, added to the filter
        l.push(6); // push 6, another even added to the filter
        expect(insertCounter).toBe(2);

        let deleteCounter = 0;
        const unsubDelete = filtered.onDelete(() => deleteCounter++);
        l(1, 5); // 6 to 5 which is odd, removed from the filter
        l.pop(); // delete 6, another odd removed from the filter
        expect(deleteCounter).toBe(2);

        // ensure filtered still up to date with l, also to fulfill coverage
        expect(filtered()).toEqual(rawEvens(l));
        expect(filtered(0)).toBe(l(0));

        unsubUpdate();
        l(0, 2);
        l(1, 3);
        expect(updateCounter).toBe(1);

        unsubInsert();
        l(1, 6);
        l.push(6);
        expect(insertCounter).toBe(2);

        unsubDelete();
        l(1, 5);
        l.pop();
        expect(deleteCounter).toBe(2);
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

    test('chain observed filter', () => {
        const l = list(randomList(10));
        const filtered = evens(l);
        const chained = chainList(filtered);

        expect(chained()).toEqual(chainRawList(rawEvens(l)));
    });
});
