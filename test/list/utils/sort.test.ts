import { describe, test, expect } from 'bun:test';
import { list } from '../../../list';
import { sort } from '../../../list/utils/sort';
import { randomNumber } from '@aldinh777/toolbox/random';
import { randomList } from '../../test-util';

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
        const l = list(randomList(100));
        const sortl = sort(l);

        const index = randomNumber(10);
        l(index, l(index) + 1);
        l.push(randomNumber(100));
        l.shift();
        l.splice(index, 1, randomNumber(10));

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
