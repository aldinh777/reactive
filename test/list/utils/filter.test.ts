import { describe, test, expect } from 'bun:test';
import { list } from '../../../list';
import { filter } from '../../../list/utils/filter';
import { randomNumber } from '@aldinh777/toolbox/random';
import { randomList } from '../../test-util';

describe('list-util filter', () => {
    test('initialize properly', () => {
        const l = list(randomList(10));
        const filterl = filter(l, (item) => item % 2 === 0);

        expect(filterl()).toEqual(l().filter((i) => i % 2 === 0));
    });

    test('filter properly after mutation', () => {
        const l = list(randomList(100));
        const filterl = filter(l, (item) => item % 2 === 0);

        const index = randomNumber(10);
        l(index, l(index) + 1);
        l.push(randomNumber(100));
        l.shift();
        l.splice(index, 1, randomNumber(10));

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
