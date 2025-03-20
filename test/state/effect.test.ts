import type { State } from '@aldinh777/reactive';
import { describe, test, expect } from 'bun:test';
import { state, computed, setEffect } from '@aldinh777/reactive';
import { randomNumber } from '../test-util';

const add = (x: State, n = 1) => x.setValue(x.getValue() + n);

describe('utils', () => {
    test('basic computed', () => {
        const a = state(randomNumber(100));
        const b = state(randomNumber(100));
        const x = computed(() => a.getValue() + b.getValue());

        expect(x.getValue()).toBe(a.getValue() + b.getValue());

        add(a);
        add(b);

        expect(x.getValue()).toBe(a.getValue() + b.getValue());
    });

    test('observe computed', () => {
        const a = state(randomNumber(100));
        const x = computed(() => a.getValue() + 1);
        let observedUpdate = 0;

        const unsub = x.onChange(() => observedUpdate++);

        // nothing has been updated yet
        expect(observedUpdate).toBe(0);

        // update x value
        add(a);

        // ensure update are watched
        expect(x.getValue()).toBe(a.getValue() + 1);
        expect(observedUpdate).toBe(1);

        // stop watching update, computed no longer has any observer and then unsubscribed automatically
        unsub();

        add(a);

        expect(x.getValue()).toBe(a.getValue() + 1);
        expect(observedUpdate).toBe(1);
    });

    test('basic effect', () => {
        const a = state(randomNumber(100));
        let effectCounter = 0;

        const unsub = setEffect(() => {
            a.getValue();
            effectCounter++;
        });

        add(a);
        expect(effectCounter).toBe(2);

        unsub();
        add(a);
        expect(effectCounter).toBe(2);
    });

    test('static computed', () => {
        const a = state(randomNumber(100));
        const b = state(randomNumber(100));
        const x = computed((a, b) => a + b, [a, b]);

        expect(x.getValue()).toBe(a.getValue() + b.getValue());

        add(a);
        add(b);

        expect(x.getValue()).toBe(a.getValue() + b.getValue());

        let computedCounter = 0;
        const unsub = x.onChange(() => computedCounter++);

        add(a);

        expect(computedCounter).toBe(1);

        unsub();
        add(a);

        expect(computedCounter).toBe(1);
    });

    test('static effect', () => {
        const a = state(randomNumber(100));
        let effectCounter = 0;

        const unsub = setEffect((_) => effectCounter++, [a]);

        expect(effectCounter).toBe(1);

        add(a);
        expect(effectCounter).toBe(2);

        unsub();
        add(a);
        expect(effectCounter).toBe(2);
    });

    test('circular effect', () => {
        const x = state(randomNumber(100));

        setEffect(() => {
            if (x.getValue() < 120) {
                add(x);
            }
        });

        expect(x.getValue()).toBe(120);
    });

    test('circular dependency', () => {
        let iter = 100;

        const x = computed(() => (iter <= 0 ? 'overflow' : iter-- && x.getValue()));

        const a = computed(() => (iter <= 0 ? 'flip overflow' : iter-- && b.getValue()));
        const b = computed(() => (iter <= 0 ? 'flip overflow' : iter-- && a.getValue()));

        expect(x.getValue()).toBe('overflow');

        iter = 0;
        expect(a.getValue()).toBe('flip overflow');

        iter = 0;
        expect(b.getValue()).toBe('flip overflow');
    });

    test('diamond structure dependency', () => {
        const x = state(randomNumber(100));

        const a = computed(() => x.getValue());
        const b = computed(() => x.getValue());
        const c = computed(() => a.getValue() + b.getValue());

        const staticA = computed((x) => x, [x]);
        const staticB = computed((x) => x, [x]);
        const staticC = computed((a, b) => a + b, [staticA, staticB]);

        let updateCounter = 0;
        let staticUpdateCounter = 0;

        c.onChange(() => updateCounter++);
        staticC.onChange(() => staticUpdateCounter++);
        add(x);

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
            return isUsingX.getValue() ? x.getValue() : y.getValue();
        });

        // make them push based so it actually depends on x or y dynamically
        a.onChange(() => {}); // calculation here +1 = 1

        expect(calculationCalls).toBe(1);

        add(x); // won't count since a currently not depends on x
        add(y); // calculation here +1 = 2

        expect(calculationCalls).toBe(2);

        isUsingX.setValue(true); // calculation here +1 = 3

        expect(calculationCalls).toBe(3);

        add(x); // calculation here +1 = 4
        add(y); // won't count since now a didn't depends on y

        expect(calculationCalls).toBe(4);
    });

    test('when nested effect', () => {
        const x = state(randomNumber(100));
        const y = state(randomNumber(100));
        let counterX = 0;
        let counterY = 0;
        setEffect(() => {
            x.getValue(); // used as dependency
            counterX++;
            setEffect(() => {
                y.getValue(); // used as dependency
                counterY++;
            });
        });

        add(y);
        expect(counterX).toBe(1); // x is having different effect stack
        expect(counterY).toBe(2); // y is used as dependency

        add(x);
        expect(counterX).toBe(2); // x is used as dependency
        expect(counterY).toBe(3); // y isnt used, but the effect from x create another effect affecting y

        add(y);
        expect(counterX).toBe(2); // like before, x is having different stack
        expect(counterY).toBe(5); // update from the first effect and the second newly created effect from x effect

        // if you're confused, then you probably shouldn't create any nested effect
    });

    test('using dynamic dependency to create static effect', () => {
        const a = state(randomNumber(100));
        const b = state(randomNumber(100));
        const c = computed(() => a.getValue() + 1); // c are dynamically dependent on a

        // make it push based, so it actually depends on a
        c.onChange(() => {});

        /**
         * no dynamic dependency detected from dependency list,
         * making x depends only on b even when c is also being called inside computed
         */
        const x = computed((b) => b + c.getValue(), [b]);
        let counterX = 0;
        x.onChange(() => counterX++);
        add(a); // counterX = 0, x did not depends on a
        add(b); // counterX = 1
        expect(counterX).toBe(1);

        /**
         * in this case, c has dynamic dependency which is a,
         * making y depends on whatever being used inside computed, including b
         */
        const y = computed((c) => b.getValue() + c, [c]);
        let counterY = 0;
        y.onChange(() => counterY++);
        add(a); // counterY = 1, y dynamically depends on c which also dynamically depends on a
        add(b); // counterY = 2, y also dynamically depends on b
        expect(counterY).toBe(2);
    });

    test('when effect have no dependency', () => {
        // literally nothing to watch
        const x = computed(() => null);
        const y = computed(() => null, []);
        setEffect(() => null);
        setEffect((_) => null, []);

        // what else to expect...
        expect(x.getValue()).toBeNull();
        expect(y.getValue()).toBeNull();
    });

    test('when effect has suddenly lost it all dependencies', () => {
        const x = state(randomNumber(100));
        let counter = 0;
        let usingX = true;
        setEffect(() => ++counter && usingX && x.getValue()); // counter = 1
        usingX = false;
        add(x); // counter = 2, after running, effect lost its dependencies
        add(x); // counter = 2, effect no longer running
        expect(counter).toBe(2);
    });
});
