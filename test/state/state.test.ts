import { describe, test, expect } from 'bun:test';
import { state } from '../../state/index.ts';
import { randomNumber } from '../test-util.ts';

describe('core state functionality', () => {
    test('initialize correctly', () => {
        const value = randomNumber(10);
        const x = state(value);
        expect(x()).toBe(value);
    });

    test('update value', () => {
        const newValue = randomNumber(10);
        const x = state(randomNumber(10));
        x(newValue);
        expect(x()).toBe(newValue);
    });

    test('listen to change', () => {
        let counter = 0;
        const x = state(0);
        x.onChange(() => counter++);
        x(1);
        x(2);
        x(2); // supposedly wont trigger because no change
        expect(counter).toBe(2);
    });

    test('stop listening to change', () => {
        let counter = 0;
        const x = state(0);
        const unsub = x.onChange(() => counter++);
        x(1); // ensure it was triggered at least once
        unsub();
        x(2);
        x(3);
        expect(counter).toBe(1);
    });

    test('orderly execute listener', () => {
        let firstCounter = 0;
        let secondCounter = 0;
        let thirdCounter = 0;
        const x = state(0);
        x.onChange((current) => {
            if (current % 2 === 0) {
                x(current + 1);
            }
            firstCounter++;
        });
        x.onChange((current) => {
            if (current === 5) {
                x(6);
            }
            secondCounter++;
        });
        x.onChange(() => thirdCounter++);
        x(1);
        x(2);
        x(4);
        /**
         * last updated value is 4 but it would be updated in the process
         *
         * - the first listener would add 1 and turn 4 into 5
         * - the second listener would turn 5 into 6
         * - it get reexecuted and the first listener would turn it into 7
         */
        expect(x()).toBe(7);
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
                x(current + 1);
            }
            firstCounter++;
        };
        const unsubFirst = x.onChange(disallowEvenNumber);
        // isLast optional parameter set to true
        x.onChange(() => lastCounter++, true);

        // 1st change, increase firstCounter to 1 and lastCounter to 1
        x(1);
        // 2nd change, updating x to 3, firstCounter increased to 2
        // 3rd change, increase firstCounter to 3 and lastCounter to 2
        x(2);

        expect(firstCounter).toBe(3);
        expect(lastCounter).toBe(2);

        firstCounter = 0;
        lastCounter = 0;
        // remove and reattach disallowEvenNumber listener
        unsubFirst();
        x.onChange(disallowEvenNumber);

        x(1);
        x(2);

        // it should execute in the same order
        expect(firstCounter).toBe(3);
        expect(lastCounter).toBe(2);
    });

    test('properly stringified', () => {
        const num = randomNumber(10);
        const x = state(num);
        expect(x.toString()).toBe(`State { ${num} }`);
    });
});
