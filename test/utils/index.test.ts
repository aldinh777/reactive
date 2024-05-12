import { describe, test, expect } from 'bun:test';
import { computed, computedStatic, setEffect, setEffectStatic } from '../../utils';
import { state } from '../../state';
import { randomNumber } from '@aldinh777/toolbox/random';

describe('utils', () => {
    test('basic computed', () => {
        const a = state(randomNumber(100));
        const b = state(randomNumber(100));
        const x = computed(() => a() + b());

        a(a() + 1);
        b(b() + 1);

        expect(x()).toBe(a() + b());

        x.stop();
        a(a() + 1);
        b(b() + 1);

        expect(x()).not.toBe(a() + b());
    });

    test('basic effect', () => {
        const a = state(randomNumber(100));
        let effectCounter = 0;

        const unsub = setEffect(() => {
            a();
            effectCounter++;
        });

        a(a() + 1);
        expect(effectCounter).toBe(2);

        unsub();
        a(a() + 1);
        expect(effectCounter).toBe(2);
    });

    test('static computed', () => {
        const a = state(randomNumber(100));
        const b = state(randomNumber(100));
        const x = computedStatic([a, b], (a, b) => a + b);

        a(a() + 1);
        b(b() + 1);

        expect(x()).toBe(a() + b());

        x.stop();
        a(a() + 1);
        b(b() + 1);

        expect(x()).not.toBe(a() + b());
    });

    test('static effect', () => {
        const a = state(randomNumber(100));
        let effectCounter = 0;

        const unsub = setEffectStatic([a], (a) => effectCounter++);

        a(a() + 1);
        expect(effectCounter).toBe(2);

        unsub();
        a(a() + 1);
        expect(effectCounter).toBe(2);
    });

    test('diamond structure dependency', () => {
        const x = state(randomNumber(100));

        const a = computed(() => x());
        const b = computed(() => x());
        const c = computed(() => a() + b());

        const staticA = computedStatic([x], (x) => x);
        const staticB = computedStatic([x], (x) => x);
        const staticC = computedStatic([staticA, staticB], (a, b) => a + b);

        let updateCounter = 0;
        let staticUpdateCounter = 0;

        c.onChange(() => updateCounter++);
        staticC.onChange(() => staticUpdateCounter++);
        x(x() + 1);

        expect(updateCounter).toBe(1);
        expect(staticUpdateCounter).toBe(1);
    });

    test('dynamic dependency', () => {
        const x = state(randomNumber(100));
        const y = state(randomNumber(100));
        const isUsingX = state(false);

        let calculationCalls = 0;

        const a = computed(() => {
            calculationCalls++;
            return isUsingX() ? x() : y();
        });

        expect(calculationCalls).toBe(1);

        x(x() + 1); // won't count since a currently not depends on x
        y(y() + 1);

        expect(calculationCalls).toBe(2);

        isUsingX(true);
        x(x() + 1); // will count because a now depends on x
        y(y() + 1); // won't count since now a didn't depends on y

        expect(calculationCalls).toBe(4);
    });

    test('error when nested effect', () => {
        const x = state(0);
        expect(() => setEffect(() => computed(() => x() + 1))).toThrow();
    });

    test('error when using non-static to create static effect', () => {
        const x = state(0);
        const y = computed(() => x());
        expect(() => setEffectStatic([y], (y) => y + 1)).toThrow();
    });

    test('error when effect have no dependency', () => {
        expect(() => computed(() => null)).toThrow();
        expect(() => setEffect(() => null)).toThrow();
        expect(() => computedStatic([], () => null)).toThrow();
        expect(() => setEffectStatic([], () => null)).toThrow();
    });

    test('error when effect has suddenly lost it all dependencies', () => {
        const x = state(0);
        let usingX = true;
        setEffect(() => usingX && x());
        usingX = false;
        expect(() => x(1)).toThrow();
    });
});