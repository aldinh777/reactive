import { describe, test, expect } from 'bun:test';
import { list } from '../../../list';
import { sort } from '../../../list/utils/sort';
import { randomList, randomNumber } from '../../test-util';

function sortList(list: number[]) {
    return list.toSorted((a, b) => a - b);
}

describe('list-util sort', () => {
    test('initialize properly', () => {
        const l = list(randomList(10));
        const sortl = sort(l);

        expect(sortl()).toEqual(sortList(l()));
    });

    test('sort properly after mutation', () => {
        const l = list([1, 9, 2, 8, 3, 4, 6, 5]);
        const sortl = sort(l);

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

        expect(sortl()).toEqual(sortList(l()));
    });

    test('wont update from sort directly', () => {
        const l = list(randomList(10));
        const sortl: any = sort(l);

        sortl(randomNumber(10), randomNumber(100));

        expect(sortl()).toEqual(sortList(l()));
    });

    test('stop sorting', () => {
        const l = list(randomList(10));
        const sortl = sort(l);
        const oldSort = [...sortl()];

        sortl.stop();
        const index = randomNumber(10);
        l(index, l(index) + 1);

        expect(sortl()).toEqual(oldSort);
    });

    test('properly stringified', () => {
        const l = list(randomList(10));
        const sortl = sort(l);

        expect(sortl.toString()).toBe(`SortedList [ ${sortl().join(', ')} ]`);
    });
});
