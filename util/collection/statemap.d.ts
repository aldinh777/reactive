import { StateMap, StateMapObject } from '../../collection/StateMap';
interface SimpleObject<T> {
    [key: string]: T;
}
export declare type StateMapProxy<T> = StateMap<T> & SimpleObject<T>;
export declare function statemap<T>(map: StateMapObject<T> | Map<string, T>): StateMapProxy<T>;
export {};
