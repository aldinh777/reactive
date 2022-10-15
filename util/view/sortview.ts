import { StateList } from '../../collection/StateList';
import { ListViewSorted } from '../../collection/view/ListViewSorted';

export function sortview<T>(
    list: StateList<T>,
    sorter?: (item: T, elem: T) => boolean
): ListViewSorted<T> {
    return new ListViewSorted(list, sorter || ((item, compare) => item < compare));
}
