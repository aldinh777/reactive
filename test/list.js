const { equal, fail, deepEqual } = require('assert');
const { statelist } = require('../util/collection');
const { StateListMapped } = require('../collection/list/StateListMapped');
const { StateListFiltered } = require('../collection/list/StateListFiltered');

describe('Mapped State List', function () {
    const list = statelist([1, 2, 3, 4, 5]);
    const mapped = new StateListMapped(list, (i) => i * 2);
    it('watch update', function () {
        list[1] = 10;
        deepEqual(mapped.raw, [2, 20, 6, 8, 10]);
    });
    it('watch insert', function () {
        list.splice(1, 0, 20);
        deepEqual(mapped.raw, [2, 40, 20, 6, 8, 10]);
    });
    it('watch delete', function () {
        list.splice(2, 1);
        deepEqual(mapped.raw, [2, 40, 6, 8, 10]);
    });
});

describe('Filtered State List', function () {
    const list = statelist([1, -2, 3, 4, 5]);
    const filtered = new StateListFiltered(list, (i) => i >= 0);
    const Y = true;
    const N = false;
    it('initial state correct', function () {
        deepEqual(filtered.raw, [1, 3, 4, 5]);
        deepEqual(filtered._f, [Y, N, Y, Y, Y]);
    });
    it('watch update from true to true', function () {
        // [1, -2, 6, 4, 5]
        list[2] = 6;
        deepEqual(filtered.raw, [1, 6, 4, 5]);
        deepEqual(filtered._f, [Y, N, Y, Y, Y]);
    });
    it('watch update from true to false', function () {
        // [1, -2, 6, -4, 5]
        list[3] = -4;
        deepEqual(filtered.raw, [1, 6, 5]);
        deepEqual(filtered._f, [Y, N, Y, N, Y]);
    });
    it('watch update from false to true', function () {
        // [1, 2, 6, -4, 5]
        list[1] = 2;
        deepEqual(filtered.raw, [1, 2, 6, 5]);
        deepEqual(filtered._f, [Y, Y, Y, N, Y]);
    });
    it('watch update from false to false', function () {
        // [1, 2, 6, -7, 5]
        list[3] = -7;
        deepEqual(filtered.raw, [1, 2, 6, 5]);
        deepEqual(filtered._f, [Y, Y, Y, N, Y]);
    });
    it('watch insert true value', function () {
        // [1, 2, 8, 6, -7, 5]
        list.splice(2, 0, 8);
        deepEqual(filtered.raw, [1, 2, 8, 6, 5]);
        deepEqual(filtered._f, [Y, Y, Y, Y, N, Y]);
    });
    it('watch insert false value', function () {
        // [1, 2, 8, -9, 6, -7, 5]
        list.splice(3, 0, -9);
        deepEqual(filtered.raw, [1, 2, 8, 6, 5]);
        deepEqual(filtered._f, [Y, Y, Y, N, Y, N, Y]);
    });
    it('watch delete true value', function () {
        // [1, 2, -9, 6, -7, 5]
        list.splice(2, 1);
        deepEqual(filtered.raw, [1, 2, 6, 5]);
        deepEqual(filtered._f, [Y, Y, N, Y, N, Y]);
    });
    it('watch delete false value', function () {
        // [1, 2, 6, -7, 5]
        list.splice(2, 1);
        deepEqual(filtered.raw, [1, 2, 6, 5]);
        deepEqual(filtered._f, [Y, Y, Y, N, Y]);
    });
});
