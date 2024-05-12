export const randomNumber = (range: number) => {
    return Math.floor(Math.random() * range)
}

export const randomString = (size: number) => {
    const charset = `1234567890qwertyuiopasdfghjklzxcvbnm`
    return [...Array(size)].map(() => charset[randomNumber(charset.length)]).join('')
}

export const randomList = (length: number) => {
    const list: number[] = [];
    for (let i = 0; i < length; i++) {
        list.push(randomNumber(100));
    }
    return list;
};
