import { describe, test, expect } from 'bun:test';
import { list } from '../../list/index.ts';
import { avg, count, product, sum } from '../../list/reduce.ts';

describe('reduce utilities', () => {
    test('sum', () => {
        const l = list([1, 2, 3, -4, 5]);
        const suml = sum(l);

        expect(suml()).toBe(1 + 2 + 3 + -4 + 5);

        l.splice(2, 2, 77);
        expect(suml()).toBe(1 + 2 + 77 + 5);

        l(2, 3);
        expect(suml()).toBe(1 + 2 + 3 + 5);
    });

    test('product', () => {
        const l = list([2, 3, 5, 7]);
        const prodl = product(l);

        expect(prodl()).toBe(2 * 3 * 5 * 7);

        l.push(11);
        expect(prodl()).toBe(2 * 3 * 5 * 7 * 11);

        l.push(0);
        expect(prodl()).toBe(2 * 3 * 5 * 7 * 11 * 0);

        l.pop();
        expect(prodl()).toBe(2 * 3 * 5 * 7 * 11);

        l(0, 0);
        expect(prodl()).toBe(0 * 3 * 5 * 7 * 11);

        l(0, 13);
        expect(prodl()).toBe(13 * 3 * 5 * 7 * 11);
    });

    test('count', () => {
        const l = list([1, 2, 3, 4, 5]);
        const countl = count(l);

        expect(countl()).toBe(l().length);

        l.push(6, 7, 8);
        expect(countl()).toBe(l().length);

        l.splice(0, 3);
        expect(countl()).toBe(l().length);

        // nope
        // l(20, 5);
        // expect(countl()).toBe(l().length);
    });

    test('avg', () => {
        const l = list([2, 4, 6, 8, 10]);
        const avgl = avg(l);

        expect(avgl()).toBe((2 + 4 + 6 + 8 + 10) / 5);

        l.splice(0, 5);
        expect(avgl()).toBe(0);
    });
});
