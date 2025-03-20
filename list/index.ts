export type UpdateHandler<T> = (index: number, value: T, prev: T) => any;
export type InsertHandler<T> = (index: number, value: T, last: boolean) => any;
export type DeleteHandler<T> = (index: number, value: T) => any;
export type OperationHandler<T> = (index: number, value: T, updated?: T | boolean) => any;

export interface BulkWatcher<T> {
    insert?: InsertHandler<T>;
    delete?: DeleteHandler<T>;
    update?: UpdateHandler<T>;
}

type Operation = '+' | '-' | '=';

export class WatchableList<T = any> {
    #listeners = {
        '=': new Set<OperationHandler<T>>(),
        '+': new Set<OperationHandler<T>>(),
        '-': new Set<OperationHandler<T>>()
    };
    #unique: boolean;

    protected array: T[];

    constructor(array: T[], unique: boolean = true) {
        // clone array, make sure any external refference updates wont interfere
        this.array = [...array];
        this.#unique = unique;
    }

    toString(): string {
        return `WatchableList { ${this.toArray()} }`;
    }

    toArray() {
        // ensure returned array wont be updated externally
        return [...this.array];
    }

    at(index: number): T {
        return this.array[index];
    }

    trigger(op: Operation, index: number, value: T, updated?: T | boolean) {
        const handlers = this.#listeners[op];
        for (const handle of handlers || []) {
            // skip trigger if the updated value are the same with current value,
            // unless unique flag are set to false
            if (op !== '=' || !this.#unique || value !== updated) {
                handle(index, value, updated);
            }
        }
    }

    onUpdate(handler: UpdateHandler<T>): () => void {
        return this.attachListener(this.#listeners['='], handler as OperationHandler<T>);
    }

    onInsert(handler: InsertHandler<T>): () => void {
        return this.attachListener(this.#listeners['+'], handler as OperationHandler<T>);
    }

    onDelete(handler: DeleteHandler<T>): () => void {
        return this.attachListener(this.#listeners['-'], handler);
    }

    attachListener(listeners: Set<OperationHandler<T>>, handler: OperationHandler<T>): () => void {
        listeners.add(handler);
        return () => listeners.delete(handler);
    }

    watch(operations: BulkWatcher<T>) {
        const unsubUpdate = operations.update && this.onUpdate(operations.update as OperationHandler<T>);
        const unsubInsert = operations.insert && this.onInsert(operations.insert as OperationHandler<T>);
        const unsubDelete = operations.delete && this.onDelete(operations.delete);
        return () => {
            unsubUpdate?.();
            unsubInsert?.();
            unsubDelete?.();
        };
    }

    filter(fn: (item: T) => boolean): FilteredList<T> {
        return new FilteredList(this, fn);
    }

    map<U>(fn: (item: T) => U): MappedList<T, U> {
        return new MappedList(this, fn);
    }

    sort(fn: (item: T, elem: T) => boolean = SortedList.asc) {
        return new SortedList(this, fn);
    }
}

export class ReactiveList<T = any> extends WatchableList<T> {
    set(index: number, value: T) {
        const prev = this.array[index];
        this.array[index] = value;
        this.trigger('=', index, value, prev);
    }

    push(...items: T[]): number {
        this.splice(this.array.length, 0, ...items);
        return this.array.length;
    }

    pop(): T | undefined {
        return this.splice(this.array.length - 1, 1)[0];
    }

    shift(): T | undefined {
        return this.splice(0, 1)[0];
    }

    unshift(...items: T[]): number {
        this.splice(0, 0, ...items);
        return this.array.length;
    }

    splice(start: number, deleteCount: number = 0, ...items: T[]): T[] {
        const deletedItems = this.array.splice(start, deleteCount, ...items);
        for (const deleted of deletedItems) {
            this.trigger('-', start, deleted);
        }
        for (let i = 0; i < items.length; i++) {
            this.trigger('+', start + i, items[i]);
        }
        return deletedItems;
    }
}

export class ObservedList<S, T> extends WatchableList<T> {
    protected totalObservers = 0;
    unsubscribe?: () => void;
    source: WatchableList<S>;

    constructor(source: WatchableList<S>) {
        super([]);
        this.source = source;
    }

    at(index: number): T {
        if (this.totalObservers > 0) {
            return super.at(index);
        }
        return this.toArray()[index];
    }

    // here just to be overriden by its children
    subscribe(): () => void {
        return () => {};
    }

    attachListener(listeners: Set<OperationHandler<T>>, handler: OperationHandler<T>): () => void {
        this.totalObservers++;
        if (this.totalObservers === 1) {
            this.unsubscribe = this.subscribe();
        }
        const unsub = super.attachListener(listeners, handler);
        return () => {
            this.totalObservers--;
            if (this.totalObservers === 0) {
                this.unsubscribe?.();
            }
            unsub();
        };
    }
}

export class FilteredList<T> extends ObservedList<T, T> {
    #filterOut: boolean[] = [];
    #filterFn: (item: T) => boolean;

    constructor(source: WatchableList<T>, filterFn: (item: T) => boolean) {
        super(source);
        this.#filterFn = filterFn;
    }

    toArray(): T[] {
        if (this.totalObservers > 0) {
            return super.toArray();
        }
        return this.source.toArray().filter(this.#filterFn);
    }

    subscribe(): () => void {
        this.array = [];
        this.#filterOut = this.source.toArray().map(this.#filterFn);
        for (let i = 0; i < this.#filterOut.length; i++) {
            if (this.#filterOut[i]) {
                this.array.push(this.source.at(i));
            }
        }
        return this.source.watch({
            update: (index, value, prev) => {
                const allowAfter = this.#filterFn(value);
                if (this.#filterOut[index] !== allowAfter) {
                    this.#filterOut[index] = allowAfter;
                    if (allowAfter) {
                        this.#insertFiltered(index, value);
                    } else {
                        this.#deleteFiltered(index);
                    }
                } else if (allowAfter) {
                    this.#updateFiltered(index, value, prev);
                }
            },
            insert: (index, value) => {
                const allow = this.#filterFn(value);
                this.#filterOut.splice(index, 0, allow);
                if (allow) {
                    this.#insertFiltered(index, value);
                }
            },
            delete: (index) => {
                if (this.#filterOut[index]) {
                    this.#deleteFiltered(index);
                }
                this.#filterOut.splice(index, 1);
            }
        });
    }

    #updateFiltered(index: number, value: T, prev: T): void {
        const fIndex = this.#findFilteredIndex(index);
        this.array[fIndex] = value;
        this.trigger('=', fIndex, value, prev);
    }

    #insertFiltered(index: number, value: T): void {
        const fIndex = this.#findFilteredIndex(index);
        this.array.splice(fIndex, 0, value);
        this.trigger('+', fIndex, value);
    }

    #deleteFiltered(index: number): void {
        const fIndex = this.#findFilteredIndex(index);
        const prev = this.array[fIndex];
        this.array.splice(fIndex, 1);
        this.trigger('-', fIndex, prev);
    }

    #findFilteredIndex(sourceIndex: number): number {
        let filteredIndex = 0;
        for (let i = 0; i < sourceIndex; i++) {
            if (this.#filterOut[i]) {
                filteredIndex++;
            }
        }
        return filteredIndex;
    }
}

export class MappedList<S, T> extends ObservedList<S, T> {
    #mapFn: (item: S) => T;

    constructor(source: WatchableList<S>, mapFn: (item: S) => T) {
        super(source);
        this.#mapFn = mapFn;
    }

    toArray(): T[] {
        if (this.totalObservers > 0) {
            return super.toArray();
        }
        return this.source.toArray().map(this.#mapFn);
    }

    subscribe(): () => void {
        this.array = [];
        for (const item of this.source.toArray()) {
            this.array.push(this.#mapFn(item));
        }
        return this.source.watch({
            update: (index, value) => {
                const mapped = this.#mapFn(value);
                const before = this.array[index];
                if (mapped !== before) {
                    this.array[index] = mapped;
                    this.trigger('=', index, mapped, before);
                }
            },
            insert: (index, value) => {
                const mapped = this.#mapFn(value);
                this.array.splice(index, 0, mapped);
                this.trigger('+', index, mapped);
            },
            delete: (index) => {
                const value = this.array[index];
                this.array.splice(index, 1);
                this.trigger('-', index, value);
            }
        });
    }
}

export class SortedList<T> extends ObservedList<T, T> {
    static asc = (item: any, elem: any) => item < elem;
    static desc = (item: any, elem: any) => item > elem;

    #sortFn: (item: T, elem: T) => boolean;

    constructor(source: WatchableList<T>, sortFn: (item: T, elem: T) => boolean) {
        super(source);
        this.#sortFn = sortFn;
    }

    toArray(): T[] {
        if (this.totalObservers > 0) {
            return super.toArray();
        }
        const arr: T[] = [];
        for (const item of this.source.toArray()) {
            this.#insertItem(arr, item);
        }
        return arr;
    }

    subscribe(): () => void {
        this.array = [];
        for (const item of this.source.toArray()) {
            this.#insertItem(this.array, item);
        }
        return this.source.watch({
            update: (_, value, prev) => {
                const prevIndex = this.array.indexOf(prev);
                if (prevIndex !== -1) {
                    this.array.splice(prevIndex, 1);
                    const nextIndex = this.#insertItem(this.array, value);
                    if (prevIndex === nextIndex) {
                        this.trigger('=', nextIndex, value, prev);
                    } else {
                        this.trigger('-', prevIndex, prev);
                        this.trigger('+', nextIndex, value);
                    }
                }
            },
            insert: (_, value) => {
                const insertIndex = this.#insertItem(this.array, value);
                this.trigger('+', insertIndex, value);
            },
            delete: (_, value) => {
                const index = this.array.indexOf(value);
                if (index !== -1) {
                    this.array.splice(index, 1);
                    this.trigger('-', index, value);
                }
            }
        });
    }

    #insertItem(array: T[], item: T): number {
        let insertIndex = array.length;
        for (let i = 0; i < array.length; i++) {
            const elem = array[i];
            if (this.#sortFn(item, elem)) {
                insertIndex = i;
                break;
            }
        }
        array.splice(insertIndex, 0, item);
        return insertIndex;
    }
}

export function list<T>(array: T[], unique = true): ReactiveList<T> {
    return new ReactiveList(array, unique);
}
