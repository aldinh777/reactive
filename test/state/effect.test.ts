import type { State } from "@aldinh777/reactive";
import { describe, test, expect } from "bun:test";
import { state, computed, effect } from "@aldinh777/reactive";
import { randomNumber } from "../test-util";

const add = (x: State, n = 1) => x.set(x.get() + n);

describe("state/effect", () => {
  test("basic computed", () => {
    const a = state(randomNumber(100));
    const b = state(randomNumber(100));
    const x = computed(() => a.get() + b.get());

    expect(x.get()).toBe(a.get() + b.get());

    add(a);
    add(b);

    expect(x.get()).toBe(a.get() + b.get());
  });

  test("observe computed", () => {
    const a = state(randomNumber(100));
    const x = computed(() => a.get() + 1);
    let observedUpdate = 0;

    const unsub = x.onChange(() => observedUpdate++);

    // nothing has been updated yet
    expect(observedUpdate).toBe(0);

    // update x value
    add(a);

    // ensure update are watched
    expect(x.get()).toBe(a.get() + 1);
    expect(observedUpdate).toBe(1);

    // stop watching update, computed no longer has any observer and then unsubscribed automatically
    unsub();

    add(a);

    expect(x.get()).toBe(a.get() + 1);
    expect(observedUpdate).toBe(1);
  });

  test("basic effect", () => {
    const a = state(randomNumber(100));
    let effectCounter = 0;

    const unsub = effect(() => {
      a.get();
      effectCounter++;
    });

    add(a);
    expect(effectCounter).toBe(2);

    unsub();
    add(a);
    expect(effectCounter).toBe(2);
  });

  test("static computed", () => {
    const a = state(randomNumber(100));
    const b = state(randomNumber(100));
    const x = computed((a, b) => a + b, [a, b]);

    expect(x.get()).toBe(a.get() + b.get());

    add(a);
    add(b);

    expect(x.get()).toBe(a.get() + b.get());

    let computedCounter = 0;
    const unsub = x.onChange(() => computedCounter++);

    add(a);

    expect(computedCounter).toBe(1);

    unsub();
    add(a);

    expect(computedCounter).toBe(1);
  });

  test("static effect", () => {
    const a = state(randomNumber(100));
    let effectCounter = 0;

    const unsub = effect((_) => effectCounter++, [a]);

    expect(effectCounter).toBe(1);

    add(a);
    expect(effectCounter).toBe(2);

    unsub();
    add(a);
    expect(effectCounter).toBe(2);
  });

  test("circular effect", () => {
    const x = state(randomNumber(100));

    effect(() => {
      if (x.get() < 120) {
        add(x);
      }
    });

    expect(x.get()).toBe(120);
  });

  test("circular dependency", () => {
    let iter = 100;

    // @ts-ignore
    const x = computed(() => (iter <= 0 ? "overflow" : iter-- && x.get()));

    // @ts-ignore
    const a = computed(() => (iter <= 0 ? "flip overflow" : iter-- && b.get()));
    // @ts-ignore
    const b = computed(() => (iter <= 0 ? "flip overflow" : iter-- && a.get()));

    expect(x.get()).toBe("overflow");

    iter = 0;
    expect(a.get()).toBe("flip overflow");

    iter = 0;
    expect(b.get()).toBe("flip overflow");
  });

  test("diamond structure dependency", () => {
    const x = state(randomNumber(100));

    const a = computed(() => x.get());
    const b = computed(() => x.get());
    const c = computed(() => a.get() + b.get());

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

  test("dynamic dependency", () => {
    const x = state(randomNumber(100));
    const y = state(randomNumber(100));
    const isUsingX = state(false);

    let calculationCalls = 0;

    const a = computed(() => {
      calculationCalls++;
      return isUsingX.get() ? x.get() : y.get();
    });

    // make them push based so it actually depends on x or y dynamically
    a.onChange(() => {}); // calculation here +1 = 1

    expect(calculationCalls).toBe(1);

    add(x); // won't count since a currently not depends on x
    add(y); // calculation here +1 = 2

    expect(calculationCalls).toBe(2);

    isUsingX.set(true); // calculation here +1 = 3

    expect(calculationCalls).toBe(3);

    add(x); // calculation here +1 = 4
    add(y); // won't count since now a didn't depends on y

    expect(calculationCalls).toBe(4);
  });

  test("when nested effect", () => {
    const x = state(randomNumber(100));
    const y = state(randomNumber(100));
    let counterX = 0;
    let counterY = 0;
    effect(() => {
      x.get(); // used as dependency
      counterX++;
      effect(() => {
        y.get(); // used as dependency
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

  test("using dynamic dependency to create static effect", () => {
    const a = state(randomNumber(100));
    const b = state(randomNumber(100));
    const c = computed(() => a.get() + 1); // c are dynamically dependent on a

    // make it push based, so it actually depends on a
    c.onChange(() => {});

    /**
     * no dynamic dependency detected from dependency list,
     * making x depends only on b even when c is also being called inside computed
     */
    const x = computed((b) => b + c.get(), [b]);
    let counterX = 0;
    x.onChange(() => counterX++);
    add(a); // counterX = 0, x did not depends on a
    add(b); // counterX = 1
    expect(counterX).toBe(1);

    /**
     * in this case, c has dynamic dependency which is a,
     * making y depends on whatever being used inside computed, including b
     */
    const y = computed((c) => b.get() + c, [c]);
    let counterY = 0;
    y.onChange(() => counterY++);
    add(a); // counterY = 1, y dynamically depends on c which also dynamically depends on a
    add(b); // counterY = 2, y also dynamically depends on b
    expect(counterY).toBe(2);
  });

  test("when effect have no dependency", () => {
    // literally nothing to watch
    const x = computed(() => null);
    const y = computed(() => null, []);
    effect(() => null);
    effect((_) => null, []);

    // what else to expect...
    expect(x.get()).toBeNull();
    expect(y.get()).toBeNull();
  });

  test("when effect has suddenly lost it all dependencies", () => {
    const x = state(randomNumber(100));
    let counter = 0;
    let usingX = true;
    effect(() => ++counter && usingX && x.get()); // counter = 1
    usingX = false;
    add(x); // counter = 2, after running, effect lost its dependencies
    add(x); // counter = 2, effect no longer running
    expect(counter).toBe(2);
  });
});
