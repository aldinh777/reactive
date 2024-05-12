import { describe, test, expect } from 'bun:test';
import { list } from '../../../list';
import { filter } from '../../../list/utils/filter';
import { randomList, randomNumber } from '../../test-util';

describe('list-util filter', () => {
    test('initialize properly', () => {
        const l = list(randomList(10));
        const filterl = filter(l, (item) => item % 2 === 0);

        expect(filterl()).toEqual(l().filter((i) => i % 2 === 0));
    });

    test('filter properly after mutation', () => {
        const l = list([2, 3, 4, 6, 7, 9]);
        const filterl = filter(l, (item) => item % 2 === 0);

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

        expect(filterl()).toEqual(l().filter((i) => i % 2 === 0));
    });

    test('wont update from filter directly', () => {
        const l = list(randomList(10));
        const filterl: any = filter(l, (item) => item % 2 === 0);

        filterl(randomNumber(10), randomNumber(100));

        expect(filterl()).toEqual(l().filter((i) => i % 2 === 0));
    });

    test('stop filtering', () => {
        const l = list(randomList(10));
        const filterl = filter(l, (item) => item % 2 === 0);
        const oldFilter = [...filterl()];

        filterl.stop();
        const index = randomNumber(10);
        l(index, l(index) + 1);

        expect(filterl()).toEqual(oldFilter);
    });

    test('properly stringified', () => {
        const l = list(randomList(10));
        const filterl = filter(l, (item) => item % 2 === 0);

        expect(filterl.toString()).toBe(`FilteredList [ ${filterl().join(', ')} ]`);
    });
});
