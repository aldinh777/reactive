import { StateCollection } from '../StateCollection';

export class StateList<T> extends StateCollection<number, T, T[]> {
    constructor(initial: T[] = []) {
        super();
        this.raw = initial;
    }
    get(index: number): T | undefined {
        return this.raw[index];
    }
}
