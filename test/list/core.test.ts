import { describe, test, expect } from "bun:test";
import { list } from "@aldinh777/reactive/list";
import { randomList, randomNumber } from "../test-util";

describe("list/core", () => {
  describe("core", () => {
    test("list initialization", () => {
      const items = randomList(3);
      const l = list(items);
      expect(l.toArray()).toEqual(items);
    });

    test("have no side effect towards list argument", () => {
      const items = randomList(5);
      const oldItems = [...items];
      const l = list(items);
      items.splice(2, 2, randomNumber(100));
      expect(items).not.toEqual(oldItems);
      expect(l.toArray()).toEqual(oldItems);
    });

    test("outputed array have no side effect towards list", () => {
      const l = list(randomList(5));
      const array = l.toArray();
      const index = randomNumber(5);
      array[index] = array[index] + 1;

      expect(l.toArray()).not.toEqual(array);
    });

    test("update data", () => {
      const items = randomList(3);
      const l = list(items);
      const index = randomNumber(3);
      const value = randomNumber(100);

      l.set(index, value);
      items[index] = value;
      expect(l.toArray()).toEqual(items);
    });

    test("insert data through push, unshift & splice", () => {
      const items = randomList(3);
      const startItems = randomList(2);
      const endItems = randomList(2);
      const midItems = randomList(2);
      const l = list(items);

      l.push(...endItems);
      expect(l.toArray()).toEqual([...items, ...endItems]);

      l.unshift(...startItems);
      expect(l.toArray()).toEqual([...startItems, ...items, ...endItems]);

      l.splice(5, 0, ...midItems);
      expect(l.toArray()).toEqual([...startItems, ...items, ...midItems, ...endItems]);
    });

    test("delete data through pop, shift & splice", () => {
      const items = randomList(7);
      const l = list(items);
      const end = l.pop();
      const itemEnd = items.pop()!;
      expect(l.toArray()).toEqual(items);
      expect(end).toBe(itemEnd);

      const start = l.shift();
      const itemStart = items.shift()!;
      expect(l.toArray()).toEqual(items);
      expect(start).toBe(itemStart);

      const mid = l.splice(2, 2);
      const midItems = items.splice(2, 2);
      expect(l.toArray()).toEqual(items);
      expect(mid).toEqual(midItems);
    });
  });

  describe("watchability", () => {
    test("watch list update", () => {
      const l = list(randomList(100));
      let updateCounter = 0;

      l.onUpdate(() => updateCounter++);
      for (let i = 0; i < 100; i++) {
        const index = randomNumber(100);
        const value = l.at(index) + 1;
        l.set(index, value);
      }
      expect(updateCounter).toBe(100);
    });

    test("watch non unique update", () => {
      const l = list(randomList(100), false);
      let updateCounter = 0;

      l.onUpdate(() => updateCounter++);
      for (let i = 0; i < 100; i++) {
        const index = randomNumber(100);
        const value = l.at(index);
        l.set(index, value);
      }
      expect(updateCounter).toBe(100);
    });

    test("watch list insert", () => {
      const l = list(randomList(5));
      const insertSize = randomNumber(100);
      let insertCounter = 0;

      l.onInsert(() => insertCounter++);
      l.push(...randomList(insertSize));

      expect(insertCounter).toBe(insertSize);
    });

    test("watch list delete", () => {
      const l = list(randomList(100));
      const deleteSize = randomNumber(100);
      let deleteCounter = 0;

      l.onDelete(() => deleteCounter++);
      l.splice(0, deleteSize);

      expect(deleteCounter).toBe(deleteSize);
    });

    test("bulk watch", () => {
      const l = list(randomList(100));
      const watchSize = randomNumber(100);
      let watchCounter = 0;
      const increaseWatchCounter = () => watchCounter++;

      l.watch({
        update: increaseWatchCounter,
        insert: increaseWatchCounter,
        delete: increaseWatchCounter,
      });

      for (let i = 0; i < watchSize; i++) {
        const index = randomNumber(100);
        let value = l.at(index) + 1;
        l.set(index, value);
        l.push(randomNumber(100));
        l.shift();
      }
      expect(watchCounter).toBe(watchSize * 3);
    });

    test("stop watch", () => {
      const l = list(randomList(100));
      let watchCounter = 0;
      const increaseWatchCounter = () => watchCounter++;

      const unsubAll = l.watch({
        update: increaseWatchCounter,
        insert: increaseWatchCounter,
        delete: increaseWatchCounter,
      });

      let index = randomNumber(100);
      let value = l.at(index) + 1;
      l.set(index, value);
      l.push(randomNumber(100));
      l.shift();
      expect(watchCounter).toBe(3);

      unsubAll();

      index = randomNumber(100);
      value = l.at(index) + 1;
      l.set(index, value);
      l.push(randomNumber(100));
      l.shift();
      expect(watchCounter).toBe(3);
    });
  });
});
