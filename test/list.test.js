const { statelist } = require('../util/collection');
const { StateListMapped } = require('../collection/list/StateListMapped');
const { StateListFiltered } = require('../collection/list/StateListFiltered');
const { StateListSorted } = require('../collection/list/StateListSorted');

describe('Mapped State List', function () {
    const list = statelist([1, 2, 3, 4, 5]);
    const mapped = new StateListMapped(list, (i) => i * 2);
    it('watch update', function () {
        list[1] = 10;
        expect(mapped.raw).toEqual([2, 20, 6, 8, 10]);
    });
    it('watch insert', function () {
        list.splice(1, 0, 20);
        expect(mapped.raw).toEqual([2, 40, 20, 6, 8, 10]);
    });
    it('watch delete', function () {
        list.splice(2, 1);
        expect(mapped.raw).toEqual([2, 40, 6, 8, 10]);
    });
    it('replace mapper', function () {
        mapped.replaceMapper((i) => i * 3);
        expect(mapped.raw).toEqual([3, 60, 9, 12, 15]);
    });
});

describe('Filtered State List', function () {
    const list = statelist([1, -2, 3, 4, 5]);
    const filtered = new StateListFiltered(list, (i) => i >= 0);
    const Y = true;
    const N = false;
    it('filtered correctly', function () {
        expect(filtered.raw).toEqual([1, 3, 4, 5]);
        expect(filtered._f).toEqual([Y, N, Y, Y, Y]);
    });
    it('watch update from true to true', function () {
        // [1, -2, 6, 4, 5]
        list[2] = 6;
        expect(filtered.raw).toEqual([1, 6, 4, 5]);
        expect(filtered._f).toEqual([Y, N, Y, Y, Y]);
    });
    it('watch update from true to false', function () {
        // [1, -2, 6, -4, 5]
        list[3] = -4;
        expect(filtered.raw).toEqual([1, 6, 5]);
        expect(filtered._f).toEqual([Y, N, Y, N, Y]);
    });
    it('watch update from false to true', function () {
        // [1, 2, 6, -4, 5]
        list[1] = 2;
        expect(filtered.raw).toEqual([1, 2, 6, 5]);
        expect(filtered._f).toEqual([Y, Y, Y, N, Y]);
    });
    it('watch update from false to false', function () {
        // [1, 2, 6, -7, 5]
        list[3] = -7;
        expect(filtered.raw).toEqual([1, 2, 6, 5]);
        expect(filtered._f).toEqual([Y, Y, Y, N, Y]);
    });
    it('watch insert true value', function () {
        // [1, 2, 8, 6, -7, 5]
        list.splice(2, 0, 8);
        expect(filtered.raw).toEqual([1, 2, 8, 6, 5]);
        expect(filtered._f).toEqual([Y, Y, Y, Y, N, Y]);
    });
    it('watch insert false value', function () {
        // [1, 2, 8, -9, 6, -7, 5]
        list.splice(3, 0, -9);
        expect(filtered.raw).toEqual([1, 2, 8, 6, 5]);
        expect(filtered._f).toEqual([Y, Y, Y, N, Y, N, Y]);
    });
    it('watch delete true value', function () {
        // [1, 2, -9, 6, -7, 5]
        list.splice(2, 1);
        expect(filtered.raw).toEqual([1, 2, 6, 5]);
        expect(filtered._f).toEqual([Y, Y, N, Y, N, Y]);
    });
    it('watch delete false value', function () {
        // [1, 2, 6, -7, 5]
        list.splice(2, 1);
        expect(filtered.raw).toEqual([1, 2, 6, 5]);
        expect(filtered._f).toEqual([Y, Y, Y, N, Y]);
    });
    it('replace filter', function () {
        filtered.replaceFilter((i) => Math.abs(i) > 3);
        expect(filtered.raw).toEqual([6, -7, 5]);
        expect(filtered._f).toEqual([N, N, Y, Y, Y]);
    });
});

describe('Sorted State List', function () {
    const list = statelist([5, 1, 4, 2, 3]);
    const sorted = new StateListSorted(list);
    it('sorted correctly', function () {
        expect(sorted.raw).toEqual([1, 2, 3, 4, 5]);
    });
    it('watch update position still', function () {
        // [6, 1, 4, 2, 3]
        list[0] = 6;
        expect(sorted.raw).toEqual([1, 2, 3, 4, 6]);
    });
    it('watch update position change', function () {
        // [6, 1, 7, 2, 3]
        list[2] = 7;
        expect(sorted.raw).toEqual([1, 2, 3, 6, 7]);
    });
    it('watch item inserted', function () {
        // [6, 1, 4, 2, 3, 5, 4]
        list.push(5, 4);
        expect(sorted.raw).toEqual([1, 2, 3, 4, 5, 6, 7]);
    });
    it('watch item deleted', function () {
        // [6, 1, 5, 4]
        list.splice(2, 3);
        expect(sorted.raw).toEqual([1, 4, 5, 6]);
    });
    it('replace sorter', function () {
        sorted.onInsert((i, v) => console.log('insert', v, 'at', i));
        sorted.onDelete((i, v) => console.log('delete', v, 'at', i));
        sorted.replaceSorter((i, e) => i > e);
        expect(sorted.raw).toEqual([6, 5, 4, 1]);
    });
});
