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
    expect(flag.getValue()).toBe(true);

    close();
    expect(flag.getValue()).toBe(false);

    const currentFlag = flag.getValue();
    toggle();
    expect(flag.getValue()).toBe(!currentFlag);
  });

  test("state local storage", () => {
    const initialValue = randomString(8);
    const newItem = stateLocalStorage("item", initialValue);
    expect(newItem.getValue()).toBe(initialValue);
    const newValue = initialValue + randomString(4);
    newItem.setValue(newValue);

    const existingItem = stateLocalStorage("item", initialValue);
    expect(existingItem.getValue()).toBe(newValue);
  });
});
