import { StateList } from '../../collection/StateList';
import { ListViewFiltered } from '../../collection/view/ListViewFiltered';

export function filterview<T>(
    list: StateList<T>,
    filter: (item: T) => boolean
): ListViewFiltered<T> {
    return new ListViewFiltered(list, filter);
}
