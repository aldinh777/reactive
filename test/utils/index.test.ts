import { describe, test, expect } from 'bun:test';
import { mutated, mutatedStatic, setEffect, setEffectStatic } from '../../utils';
import { state } from '../../state';
import { randomNumber } from '@aldinh777/toolbox/random';

describe('utils', () => {
    test('basic mutated', () => {
        const a = state(randomNumber(100));
        const b = state(randomNumber(100));
        const x = mutated(() => a() + b());

        a(randomNumber(100));
        b(randomNumber(100));

        expect(x()).toBe(a() + b());

        x.stop();
        a(randomNumber(100));
        b(randomNumber(100));

        expect(x()).not.toBe(a() + b());
    });

    test('basic effect', () => {
        const a = state(randomNumber(100));
        let effectCounter = 0;

        const unsub = setEffect(() => {
            a();
            effectCounter++;
        });

        a(a() * 2);
        expect(effectCounter).toBe(2);

        unsub();
        a(a() * 2);
        expect(effectCounter).toBe(2);
    });

    test('static mutated', () => {
        const a = state(randomNumber(100));
        const b = state(randomNumber(100));
        const x = mutatedStatic([a, b], (a, b) => a + b);

        a(randomNumber(100));
        b(randomNumber(100));

        expect(x()).toBe(a() + b());

        x.stop();
        a(randomNumber(100));
        b(randomNumber(100));

        expect(x()).not.toBe(a() + b());
    });

    test('static effect', () => {
        const a = state(randomNumber(100));
        let effectCounter = 0;

        const unsub = setEffectStatic([a], (a) => effectCounter++);

        a(a() * 2);
        expect(effectCounter).toBe(2);

        unsub();
        a(a() * 2);
        expect(effectCounter).toBe(2);
    });
});
