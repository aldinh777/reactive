import { MutableStateCollection } from '../StateCollection';
import { StateList } from './StateList';

export class MutableStateList<T>
    extends StateList<T>
    implements MutableStateCollection<number, T, T[]>
{
    set(index: number, value: T) {
        const previous = this.raw[index];
        if (previous === value) {
            return this;
        }
        this.raw[index] = value;
        this.trigger('set', index, value, previous);
        return this;
    }
    push(...items: T[]): number {
        this.splice(this.raw.length, 0, ...items);
        return this.raw.length;
    }
    pop(): T | undefined {
        return this.splice(this.raw.length - 1, 1)[0];
    }
    shift(): T | undefined {
        return this.splice(0, 1)[0];
    }
    unshift(...items: T[]): number {
        this.splice(0, 0, ...items);
        return this.raw.length;
    }
    splice(start: number, deleteCount: number = 0, ...items: T[]): T[] {
        const deletedItems = this.raw.splice(start, deleteCount, ...items);
        for (const deleted of deletedItems) {
            this.trigger('del', start, deleted);
        }
        for (let i = 0; i < items.length; i++) {
            this.trigger('ins', start + i, items[i]);
        }
        return deletedItems;
    }
}
