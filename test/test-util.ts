import { randomNumber } from '@aldinh777/toolbox/random';

export const randomList = (length: number) => {
    const list: number[] = [];
    for (let i = 0; i < length; i++) {
        list.push(randomNumber(100));
    }
    return list;
};
