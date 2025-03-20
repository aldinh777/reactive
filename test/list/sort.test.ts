import type { WatchableList } from '@aldinh777/reactive/list';
import { describe, test, expect } from 'bun:test';
import { list } from '@aldinh777/reactive/list';
import { randomList } from '../test-util.ts';
import { chainList, chainRawList } from '../list-util.ts';

const rawSort = (list: WatchableList<number>) => list.toArray().toSorted((a, b) => a - b);

describe('list-util sort', () => {
    test('initialize properly', () => {
        const l = list(randomList(10));
        const sorted = l.sort();
        const reversed = l.sort((a, b) => a > b);

        expect(sorted.toArray()).toEqual(rawSort(l));
        expect(reversed.toArray()).toEqual(rawSort(l).reverse());
    });

    test('watch update', () => {
        const l = list([5, 1, 4, 3, 2]);
        const sorted = l.sort();

        let updateCounter = 0;
        const unsubUpdate = sorted.onUpdate(() => updateCounter++);
        // l = [6, 1, 4, 3, 2]
        // sorted = [1, 2, 3, 4, 6]
        l.set(0, 6); // updateCounter = 1
        expect(updateCounter).toBe(1);

        let insertCounter = 0;
        const unsubInsert = sorted.onInsert(() => insertCounter++);
        // l = [6, 1, 4, 3, 2, 7]
        // sorted = [1, 2, 3, 4, 6, 7]
        l.push(7); // insertCounter = 1
        expect(insertCounter).toBe(1);

        let deleteCounter = 0;
        const unsubDelete = sorted.onDelete(() => deleteCounter++);
        // l = [6, 1, 4, 3, 2]
        // sorted = [1, 2, 3, 4, 6]
        l.pop(); // deleteCounter = 1
        expect(deleteCounter).toBe(1);

        // reposition
        // l = [6, 1, 4, 7, 2]
        // sorted = [1, 2, 4, 6, 7]
        l.set(3, 7); // delete 3, insert 7

        expect(insertCounter).toBe(2);
        expect(deleteCounter).toBe(2);

        // ensure filtered still up to date with l, also to fulfill coverage
        expect(sorted.toArray()).toEqual(rawSort(l));
        expect(sorted.at(0)).toBe(Math.min(...l.toArray()));

        unsubUpdate();
        unsubInsert();
        unsubDelete();

        // l = [9, 1, 4, 7, 2]
        // sorted = [1, 2, 4, 7, 9]
        l.set(0, 9); // delete 6, insert 9
        l.set(0, 10); // update 9 into 10

        expect(updateCounter).toBe(1);
        expect(insertCounter).toBe(2);
        expect(deleteCounter).toBe(2);
    });

    test('sort properly after mutation', () => {
        const l = list([1, 9, 2, 8, 3, 4, 6, 5]);
        const sorted = l.sort();
        const reversed = l.sort((a, b) => a > b);

        /**
         * inplace update
         * from [1, 2, 3, 4, 5, 6, 8, 9]
         * into [1, 2, 3, 4, 5, 6, 8, 10]
         */
        l.set(1, 10);
        /**
         * reposition update
         * from [1, 2, 3, 4, 5, 6, 8, 9]
         * into [1, 3, 4, 5, 6, 7, 8, 9]
         */
        l.set(2, 7);
        /**
         * insertion and positioning
         * from [1, 2, 4, 5, 6, 7, 8, 9]
         * into [1, 2, 3, 4, 5, 6, 7, 8, 9]
         */
        l.push(3);
        /**
         * delete in position
         * from [1, 2, 3, 4, 5, 6, 7, 8, 9]
         * into [1, 2, 3, 4, 6, 7, 8, 9]
         */
        l.pop();

        expect(sorted.toArray()).toEqual(rawSort(l));
        expect(reversed.toArray()).toEqual(rawSort(l).reverse());
    });

    test('chain observed filter', () => {
        const l = list(randomList(10));
        const sorted = l.sort();
        const chained = chainList(sorted);

        expect(chained.toArray()).toEqual(chainRawList(rawSort(l)));
    });
});
