import { describe, test, expect } from 'bun:test';
import { state } from '@aldinh777/reactive';
import { randomNumber } from '../test-util.ts';

describe('core state functionality', () => {
    test('initialize correctly', () => {
        const value = randomNumber(10);
        const x = state(value);
        expect(x.getValue()).toBe(value);
    });

    test('update value', () => {
        const newValue = randomNumber(10);
        const x = state(randomNumber(10));
        x.setValue(newValue);
        expect(x.getValue()).toBe(newValue);
    });

    test('listen to change', () => {
        let counter = 0;
        const x = state(0);
        x.onChange(() => counter++);
        x.setValue(1);
        x.setValue(2);
        x.setValue(2); // supposedly wont trigger because no change
        expect(counter).toBe(2);
    });

    test('stop listening to change', () => {
        let counter = 0;
        const x = state(0);
        const unsub = x.onChange(() => counter++);
        x.setValue(1); // ensure it was triggered at least once
        unsub();
        x.setValue(2);
        x.setValue(3);
        expect(counter).toBe(1);
    });

    test('orderly execute listener', () => {
        let firstCounter = 0;
        let secondCounter = 0;
        let thirdCounter = 0;
        const x = state(0);
        x.onChange((current) => {
            if (current % 2 === 0) {
                x.setValue(current + 1);
            }
            firstCounter++;
        });
        x.onChange((current) => {
            if (current === 5) {
                x.setValue(6);
            }
            secondCounter++;
        });
        x.onChange(() => thirdCounter++);
        x.setValue(1);
        expect(x.getValue()).toBe(1);

        x.setValue(2);
        /**
         * last updated value is 2 but it would be updated in the process
         *
         * - the first listener would add 1 and turn 2 into 3
         */
        expect(x.getValue()).toBe(3);

        x.setValue(4);
        /**
         * last updated value is 4 but it would be updated in the process
         *
         * - the first listener would add 1 and turn 4 into 5
         * - the second listener would turn 5 into 6
         * - it get reexecuted and the first listener would turn it into 7
         */
        expect(x.getValue()).toBe(7);

        /**
         * - first update, current x is 1
         * - second update, current x is 2, since 2 is odd, it updates into 3
         * - update from first listener, current x is 3
         * - third update, current x is 4, since 4 is odd, it updates into 5
         * - update from first listener, current x is 5
         * - update from third update, current x is 6, since 6 is odd, it updates into 7
         * - update from first listener, current x is 7
         */
        expect(firstCounter).toBe(7);

        /**
         * - first update, current x is 1
         * - second update, current x is 3, updated from first listener
         * - third update, current x is 5, updated from first listener
         * - update from second listener, current x is 7, updated from first listener
         */
        expect(secondCounter).toBe(4);

        /**
         * - first update, current x is 1
         * - second update, current x is 3, updated from first listener
         * - third update, current x is 7, updated from first and second listener
         */
        expect(thirdCounter).toBe(3);
    });

    test('last called listener', () => {
        let firstCounter = 0;
        let lastCounter = 0;
        const x = state(0);
        const disallowEvenNumber = (current: number) => {
            if (current % 2 === 0) {
                x.setValue(current + 1);
            }
            firstCounter++;
        };
        const unsubFirst = x.onChange(disallowEvenNumber);
        // isLast optional parameter set to true
        x.onChange(() => lastCounter++, true);

        // 1st change, increase firstCounter to 1 and lastCounter to 1
        x.setValue(1);
        // 2nd change, updating x to 3, firstCounter increased to 2
        // 3rd change, increase firstCounter to 3 and lastCounter to 2
        x.setValue(2);

        expect(firstCounter).toBe(3);
        expect(lastCounter).toBe(2);

        firstCounter = 0;
        lastCounter = 0;
        // remove and reattach disallowEvenNumber listener
        unsubFirst();
        x.onChange(disallowEvenNumber);

        x.setValue(1);
        x.setValue(2);

        // it should execute in the same order
        expect(firstCounter).toBe(3);
        expect(lastCounter).toBe(2);
    });

    test('correctly handle previous value', () => {
        const increasingNumber = state(0);
        let firstCounter = 0;
        let secondCounter = 0;

        increasingNumber.onChange((next, prev) => {
            firstCounter++;
            if (next < prev) {
                increasingNumber.setValue(prev);
            }
        });

        increasingNumber.onChange(() => secondCounter++);

        increasingNumber.setValue(2);
        /**
         * from 0 to 2
         * first listener calls, second listener calls too
         */
        expect(increasingNumber.getValue()).toBe(2);
        expect(firstCounter).toBe(1);
        expect(secondCounter).toBe(1);

        increasingNumber.setValue(0);
        /**
         * from 2 to 1
         * first listener calls, revert back to 0, then its gonna be 0 to 0 which is a no-op
         */
        expect(increasingNumber.getValue()).toBe(2);
        expect(firstCounter).toBe(2);
        expect(secondCounter).toBe(1);
    });
});
