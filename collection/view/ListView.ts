import { StateList } from '../StateList';

/**
 * Abstract class to be extended as list view
 *
 * - S -> Observed Statelist Type.
 * - T -> This StateList Type.
 */
export abstract class ListView<S, T> extends StateList<T> {
    protected _list: StateList<S>;

    constructor(initial: T[], list: StateList<S>) {
        super(initial);
        this._list = list;
    }
}
