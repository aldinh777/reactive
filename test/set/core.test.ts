import { describe, test, expect } from "bun:test";
import { set } from "@aldinh777/reactive/set";

describe("set/core", () => {
  test("initialization", () => {
    const s = set(["one", "two"]);
    expect(s.contains("one")).toBeTrue();
    expect(s.contains("two")).toBeTrue();
    expect(s.contains("three")).not.toBeTrue();
  });

  test("addition", () => {
    const s = set(["one"]);
    s.add("two");
    expect(s.contains("one")).toBeTrue();
    expect(s.contains("two")).toBeTrue();
  });

  test("removal", () => {
    const s = set(["one", "two"]);
    s.remove("one");
    expect(s.contains("one")).not.toBeTrue();
    expect(s.contains("two")).toBeTrue();
  });

  test("replacement", () => {
    const s = set(["one", "two"]);
    s.replace("one", "three");
    expect(s.contains("one")).not.toBeTrue();
    expect(s.contains("two")).toBeTrue();
    expect(s.contains("three")).toBeTrue();
  });

  test("toggling", () => {
    const s = set(["one", "two"]);

    s.toggle("two");
    expect(s.contains("two")).not.toBeTrue();

    s.toggle("three");
    expect(s.contains("three")).toBeTrue();
  });

  test("watchability", () => {
    const s = set(["one", "two"]);
    let removal = 0;
    let addition = 0;

    s.onUpdate((oldValue, newValue) => {
      if (oldValue) {
        removal++;
      }
      if (newValue) {
        addition++;
      }
    });

    s.add("three"); // addition = 1
    s.remove("two"); // removal = 1

    // current set ['one', 'three']
    expect(addition).toBe(1);
    expect(removal).toBe(1);

    s.replace("three", "four"); // addition = 2, removal = 2
    s.toggle("one"); // removal = 3

    // current set ['four']
    expect(addition).toBe(2);
    expect(removal).toBe(3);
  });

  test("settification", () => {
    const s = set(["one", "two", "three"]);
    expect(s.toSet().size).toBe(3);
  });
});
