import { describe, test, expect } from 'bun:test';
import { list } from '../../../list';
import { map } from '../../../list/utils/map';
import { randomList, randomNumber } from '../../test-util';

describe('list-util map', () => {
    test('initialize properly', () => {
        const l = list(randomList(10));
        const mapl = map(l, (item) => item + 1);

        expect(mapl()).toEqual(l().map((i) => i + 1));
    });

    test('map properly after mutation', () => {
        const l = list(randomList(100));
        const mapl = map(l, (item) => item + 1);

        const index = randomNumber(10);
        l(index, l(index) + 1);
        l.push(randomNumber(100));
        l.shift();
        l.splice(index, 1, randomNumber(10));

        expect(mapl()).toEqual(l().map((i) => i + 1));
    });

    test('mapped object', () => {
        const l = list(randomList(10).map((item) => ({ value: item })));
        const mapl = map(
            l,
            (item) => ({ item }),
            () => {}
        );

        const index = randomNumber(10);
        const oldMapperObj = mapl(index);
        l.push(l(index));
        expect(mapl(10)).toBe(oldMapperObj);
    });

    test('wont update from map directly', () => {
        const l = list(randomList(10));
        const mapl = map(l, (item) => item + 1) as any;

        mapl(randomNumber(10), randomNumber(100));

        expect(mapl()).toEqual(l().map((i) => i + 1));
    });

    test('stop mapping', () => {
        const l = list(randomList(10));
        const mapl = map(l, (item) => item + 1);
        const oldMapl = [...mapl()];

        mapl.stop();
        l.pop();

        expect(mapl()).toEqual(oldMapl);
    });

    test('properly stringified', () => {
        const l = list(randomList(10));
        const mapl = map(l, (item) => item + 1);

        expect(mapl.toString()).toBe(`MappedList [ ${mapl().join(', ')} ]`);
    });
});
