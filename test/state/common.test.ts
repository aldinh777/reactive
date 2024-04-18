import { describe, test, expect } from 'bun:test';
import { stateLocalStorage, stateToggle } from '../../state/common';
import { randomString } from '@aldinh777/toolbox/random';

class LocalStorageMock {
    store: any;
    length: number;
    constructor() {
        this.store = {};
    }
    key(index: number) {
        return Number.toString();
    }
    clear() {
        this.store = {};
    }
    getItem(key: string) {
        return this.store[key] || null;
    }
    setItem(key: string, value: string) {
        this.store[key] = String(value);
    }
    removeItem(key: string) {
        delete this.store[key];
    }
}

global.localStorage = new LocalStorageMock();

describe('common state', () => {
    test('state toggle', () => {
        const [flag, open, close, toggle] = stateToggle(false);

        open();
        expect(flag()).toBe(true);

        close();
        expect(flag()).toBe(false);

        const currentFlag = flag();
        toggle();
        expect(flag()).toBe(!currentFlag);
    });

    test('state local storage', () => {
        const initialValue = randomString(8);
        const newItem = stateLocalStorage('item', initialValue);
        expect(newItem()).toBe(initialValue);
        const newValue = randomString(8);
        newItem(newValue);

        const existingItem = stateLocalStorage('item', initialValue);
        expect(existingItem()).toBe(newValue);
    });
});
