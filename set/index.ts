export class ReactiveSet<T> {
  #contents: Set<T>;
  #subscriptions: Set<(oldValue: T | null, newValue: T | null) => void> = new Set();

  constructor(contents: T[]) {
    this.#contents = new Set(contents);
  }

  #triggerUpdate(oldValue: T | null, newValue: T | null): void {
    for (const handler of this.#subscriptions || []) {
      handler(oldValue, newValue);
    }
  }

  add(content: T): void {
    this.#contents.add(content);
    this.#triggerUpdate(null, content);
  }

  remove(content: T): void {
    this.#contents.delete(content);
    this.#triggerUpdate(content, null);
  }

  replace(oldValue: T, newValue: T): void {
    if (this.#contents.has(oldValue)) {
      this.#contents.delete(oldValue);
      this.#contents.add(newValue);
      this.#triggerUpdate(oldValue, newValue);
    }
  }

  contains(content: T): boolean {
    return this.#contents.has(content);
  }

  toggle(content: T): void {
    if (this.#contents.has(content)) {
      this.remove(content);
    } else {
      this.add(content);
    }
  }

  onUpdate(handlers: (oldValue: T | null, newValue: T | null) => void): () => void {
    this.#subscriptions.add(handlers);
    return () => this.#subscriptions.delete(handlers);
  }

  toString(): string {
    return Array.from(this.#contents).join(" ");
  }

  toSet(): Set<T> {
    return new Set(this.#contents);
  }
}

export function set<T>(contents: T[]): ReactiveSet<T> {
  return new ReactiveSet(contents);
}
