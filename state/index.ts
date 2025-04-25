type ChangeHandler<T> = (next: T, prev: T) => void;

export class State<T = any> {
  static circularDetector = new State(null);
  static #effectStack: Set<State>[] = [];

  #listeners = new Set<ChangeHandler<T>>();
  #lastListeners = new Set<ChangeHandler<T>>();
  #value: T;
  #isChanging = false;
  #willChange = false;

  constructor(initial: T) {
    this.#value = initial;
  }

  toString(): string {
    return `State { ${this.getValue()} }`;
  }

  getValue(): T {
    const effectStack = State.peekEffectStack();
    effectStack?.add(this);
    return this.#value;
  }

  setValue(nextValue: T): void {
    const effectStack = State.peekEffectStack();
    let oldValue = this.#value;
    this.#value = nextValue;
    this.#willChange = this.#isChanging; /** ref 1 */

    if (effectStack?.has(this)) {
      effectStack.add(State.circularDetector);
    }

    while (!this.#isChanging) {
      this.#isChanging = true;
      for (const handler of [...this.#listeners, ...this.#lastListeners]) {
        if (this.#value !== oldValue) {
          handler(this.#value, oldValue); /* ref 2 */

          // see ref 1, there is a chance ref 2 are invoking update of this state, thus setting the flag to true
          if (this.#willChange) {
            break;
          }
        }
      }

      // in case the listeners loop is stopped by break statement, reset the flag so it redo the while loop
      this.#isChanging = !this.#willChange;
      this.#willChange = false;
    }

    // when the while loop is over, set back the flag to false.
    // but in case update are invoked by ref 2, then the flag will be retrieved from ref 1
    this.#isChanging = this.#willChange;
  }

  onChange(handler: ChangeHandler<T>, last: boolean = false): () => void {
    const set = last ? this.#lastListeners : this.#listeners;
    set.add(handler);
    return () => set.delete(handler);
  }

  static peekEffectStack(): Set<State> | undefined {
    if (this.#effectStack.length <= 0) {
      return;
    }
    return this.#effectStack[this.#effectStack.length - 1];
  }

  static trackDependencies<T>(effect: () => T): [T, Set<State>] {
    this.#effectStack.push(new Set());
    const result = effect();
    const deps = this.#effectStack.pop()!;
    return [result, deps];
  }
}

export class Computed<T = any> extends State<T> {
  static rootDependencies = new WeakMap<State, Map<State, (() => void) | undefined>>();

  protected stateless: boolean;
  protected totalObservers = 0;
  protected unsubMapping = new Map<State, () => void>();
  protected effect: () => T;

  constructor(effect: () => T, stateless = false) {
    super(undefined as any);
    this.effect = effect;
    this.stateless = stateless;
  }

  getValue(): T {
    if (this.totalObservers === 0) {
      return this.effect();
    }
    return super.getValue();
  }

  setValue(nextValue: T): void {
    if (this.stateless || this.totalObservers === 0) {
      return;
    }
    super.setValue(nextValue);
  }

  unsubscribe(): void {
    for (const unsub of this.unsubMapping.values()) {
      unsub();
    }
  }

  static filterDependencies(states: Iterable<State>): Set<State> {
    const deps = new Set<State>();
    for (const dep of states) {
      if (this.rootDependencies.has(dep)) {
        const rootSet = this.rootDependencies.get(dep)!;
        for (const [root] of rootSet) {
          deps.add(root);
        }
      } else {
        deps.add(dep);
      }
    }
    return deps;
  }
}

export class ComputedDynamic<T = any> extends Computed<T> {
  static states = new WeakSet<State>();

  #recall = false;

  constructor(effect: () => T, stateless = false) {
    super(effect, stateless);
    if (this.stateless) {
      this.#subscribe();
    } else {
      ComputedDynamic.states.add(this);
    }
  }

  onChange(handler: ChangeHandler<T>, last?: boolean): () => void {
    this.totalObservers++;
    if (this.totalObservers === 1) {
      Computed.rootDependencies.set(this, this.unsubMapping);
      this.#subscribe();
    }
    const unsub = super.onChange(handler, last);
    return () => {
      this.totalObservers--;
      if (this.totalObservers === 0) {
        this.unsubscribe();
      }
      unsub();
    };
  }

  unsubscribe(): void {
    super.unsubscribe();
    this.unsubMapping.clear();
    Computed.rootDependencies.delete(this);
  }

  #subscribe(): void {
    while (true) {
      const nextValue = this.#updateDependencies();
      this.setValue(nextValue);
      if (this.#recall) {
        this.#recall = false;
        continue;
      } else {
        break;
      }
    }
  }

  #updateDependencies(): T {
    const [result, deps] = State.trackDependencies(this.effect);
    if (deps.has(State.circularDetector)) {
      this.#recall = true;
      return result;
    }
    const rootDeps = Computed.filterDependencies(deps);
    for (const [oldDep, unsub] of this.unsubMapping) {
      if (!rootDeps.has(oldDep)) {
        unsub();
        this.unsubMapping.delete(oldDep);
      }
    }
    for (const newDep of rootDeps) {
      if (!this.unsubMapping.has(newDep)) {
        this.unsubMapping.set(
          newDep,
          newDep.onChange(() => this.#subscribe())
        );
      }
    }
    return result;
  }
}

export class ComputedStatic<T, U> extends Computed<U> {
  #roots: Set<State>;

  constructor(effect: (...args: T[]) => U, args: State<T>[], stateless = false) {
    super(() => {
      const result = effect(...args.map((s) => s.getValue()));
      this.setValue(result);
      return result;
    }, stateless);
    this.#roots = Computed.filterDependencies(args);
    for (const dep of this.#roots) {
      this.unsubMapping.set(dep, undefined as any);
    }
    if (this.stateless) {
      this.#subscribe();
      this.effect();
    } else {
      ComputedDynamic.states.delete(this);
      Computed.rootDependencies.set(this, this.unsubMapping);
    }
  }

  onChange(handler: ChangeHandler<U>, last?: boolean): () => void {
    this.totalObservers++;
    if (this.totalObservers === 1) {
      this.#subscribe();
    }
    const unsub = super.onChange(handler, last);
    return () => {
      this.totalObservers--;
      if (this.totalObservers === 0) {
        this.unsubscribe();
      }
      unsub();
    };
  }

  #subscribe(): void {
    for (const dep of this.#roots) {
      this.unsubMapping.set(dep, dep.onChange(this.effect));
    }
  }
}

/**
 * Magic type that allows effect arguments to be sync with the value of input dependencies
 */
type Dependencies<T extends any[]> = { [K in keyof T]: State<T[K]> };

export function state<T>(initial: T): State<T> {
  return new State(initial);
}

export function computed<T extends any[], U>(effect: (...args: T) => U, args?: Dependencies<T>): Computed<U> {
  if (!args) {
    return new ComputedDynamic(effect);
  }
  if (args.every((s) => !ComputedDynamic.states.has(s))) {
    return new ComputedStatic(effect, args);
  }
  return new ComputedDynamic(() => effect(...(args.map((s) => s.getValue()) as any)));
}

export function setEffect<T extends any[]>(effect: (...args: T[]) => any, args?: Dependencies<T>): () => void {
  let computed;
  if (!args) {
    computed = new ComputedDynamic(effect, true);
  } else if (args.every((s) => !ComputedDynamic.states.has(s))) {
    computed = new ComputedStatic(effect, args, true);
  } else {
    computed = new ComputedDynamic(() => effect(...(args.map((s) => s.getValue()) as any)), true);
  }
  return () => computed.unsubscribe();
}
