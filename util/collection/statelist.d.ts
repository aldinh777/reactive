import { StateList } from '../../collection/StateList';
export interface StateListProxy<T> extends StateList<T> {
    [index: number]: T;
}
export declare function statelist<T>(list: T[]): StateListProxy<T>;
