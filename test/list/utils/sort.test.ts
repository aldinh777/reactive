import { describe, test, expect } from 'bun:test';
import { list, ReactiveList } from '../../../list';
import { randomList, randomNumber } from '../../test-util';
import { chainList, chainRawList } from '../list-util';

const rawSort = (list: ReactiveList<number>) => list().sort((a, b) => a - b);

describe('list-util sort', () => {
    test('initialize properly', () => {
        const l = list(randomList(10));
        const sorted = l.sort();

        expect(sorted()).toEqual(rawSort(l));
    });

    test('sort properly after mutation', () => {
        const l = list([1, 9, 2, 8, 3, 4, 6, 5]);
        const sorted = l.sort();

        /**
         * inplace update
         * from [1, 2, 3, 4, 5, 6, 8, 9]
         * into [1, 2, 3, 4, 5, 6, 8, 10]
         */
        l(1, 10);
        /**
         * reposition update
         * from [1, 2, 3, 4, 5, 6, 8, 9]
         * into [1, 3, 4, 5, 6, 7, 8, 9]
         */
        l(2, 7);
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

        expect(sorted()).toEqual(rawSort(l));
    });

    test('wont update from sort directly', () => {
        const l = list(randomList(10));
        const sorted = l.sort();

        (sorted as any)(randomNumber(10), randomNumber(100));

        expect(sorted()).toEqual(rawSort(l));
    });

    test('stop sorting', () => {
        const l = list(randomList(10));
        const sorted = l.sort();
        const oldSort = [...sorted()];

        sorted.stop();
        const index = randomNumber(10);
        l(index, l(index) + 1);

        expect(sorted()).toEqual(oldSort);
    });

    test('chain observed filter', () => {
        const l = list(randomList(10));
        const sorted = l.sort();
        const chained = chainList(sorted);

        expect(chained()).toEqual(chainRawList(rawSort(l)));
    });

    test('properly stringified', () => {
        const l = list(randomList(10));
        const sorted = l.sort();

        expect(sorted.toString()).toBe(`SortedList [ ${sorted().join(', ')} ]`);
    });
});
