import { MutableStateCollection } from './StateCollection';
import { StateMap } from './StateMap';

export class MutableStateMap<T>
    extends StateMap<T>
    implements MutableStateCollection<string, T, Map<string, T>>
{
    set(key: string, value: T): this {
        if (this.raw.has(key)) {
            const prev = this.raw.get(key);
            this.raw.set(key, value);
            this.trigger('set', key, value, prev);
        } else {
            this.raw.set(key, value);
            this.trigger('ins', key, value);
        }
        return this;
    }
    clear(): void {
        const items = Array.from(this.raw.entries());
        this.raw.clear();
        for (const [key, deleted] of items) {
            this.trigger('del', key, deleted);
        }
    }
    delete(key: string): boolean {
        const item = this.raw.get(key);
        const result = this.raw.delete(key);
        if (result) {
            this.trigger('del', key, item as T);
        }
        return result;
    }
}
