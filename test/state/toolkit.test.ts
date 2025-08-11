import { describe, test, expect } from "bun:test";
import { stateLocalStorage, stateToggle } from "@aldinh777/reactive/toolkit";
import { randomString } from "../test-util";

class LocalStorageMock {
  store: any;
  length: number;
  constructor() {
    this.store = {};
    this.length = 0;
  }
  getItem(key: string) {
    return this.store[key] || null;
  }
  setItem(key: string, value: string) {
    this.store[key] = String(value);
  }
}

// @ts-ignore
global.localStorage = new LocalStorageMock();

describe("state-toolkit", () => {
  test("state toggle", () => {
    const [flag, open, close, toggle] = stateToggle(false);

    open();
    expect(flag.get()).toBe(true);

    close();
    expect(flag.get()).toBe(false);

    const currentFlag = flag.get();
    toggle();
    expect(flag.get()).toBe(!currentFlag);
  });

  test("state local storage", () => {
    const initialValue = randomString(8);
    const newItem = stateLocalStorage("item", initialValue);
    expect(newItem.get()).toBe(initialValue);
    const newValue = initialValue + randomString(4);
    newItem.set(newValue);

    const existingItem = stateLocalStorage("item", initialValue);
    expect(existingItem.get()).toBe(newValue);
  });
});
