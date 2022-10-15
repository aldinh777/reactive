const { statelist } = require('../util/collection');
const { ListViewMapped } = require('../collection/view/ListViewMapped');
const { ListViewFiltered } = require('../collection/view/ListViewFiltered');
const { ListViewSorted } = require('../collection/view/ListViewSorted');

describe('Mapped State List', function () {
    const list = statelist([1, 2, 3, 4, 5]);
    const mapped = new ListViewMapped(list, (i) => i * 2);
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
    const filtered = new ListViewFiltered(list, (i) => i >= 0);
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
    const sorted = new ListViewSorted(list);
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
        sorted.replaceSorter((i, e) => i > e);
        expect(sorted.raw).toEqual([6, 5, 4, 1]);
    });
});

describe('Does it work with object?', function () {
    const list = statelist([{ x: 1 }, { x: 5 }, { x: -2 }, { x: 4 }, { x: 3 }]);
    // SIMPLY REPLACE OBJECT EVERY UPDATE
    const mappedSimple = new ListViewMapped(list, (o) => ({ a: o.x }));
    // MAP AND STORE VALUES BASED ON OBJECT REFFERENCE
    const mappedObj = new ListViewMapped(
        list,
        (o) => ({ a: o.x }),
        (i, e) => (e.a = i.x)
    );
    const filtered = new ListViewFiltered(list, (o) => o.x > 0);
    const sorted = new ListViewSorted(list, (i, e) => i.x > e.x);
    it('initialize flawlessly', function () {
        expect(mappedSimple.raw).toEqual([{ a: 1 }, { a: 5 }, { a: -2 }, { a: 4 }, { a: 3 }]);
        expect(mappedObj.raw).toEqual([{ a: 1 }, { a: 5 }, { a: -2 }, { a: 4 }, { a: 3 }]);
        expect(filtered.raw).toEqual([{ x: 1 }, { x: 5 }, { x: 4 }, { x: 3 }]);
        expect(sorted.raw).toEqual([{ x: 5 }, { x: 4 }, { x: 3 }, { x: 1 }, { x: -2 }]);
    });
    it('watch update flawlessly', function () {
        list[0].x = -3;
        // MUST TRIGGER MANUALLY!!!
        list.trigger('set', 0, list[0], list[0]);
        expect(mappedSimple.raw).toEqual([{ a: -3 }, { a: 5 }, { a: -2 }, { a: 4 }, { a: 3 }]);
        expect(mappedObj.raw).toEqual([{ a: -3 }, { a: 5 }, { a: -2 }, { a: 4 }, { a: 3 }]);
        expect(filtered.raw).toEqual([{ x: 5 }, { x: 4 }, { x: 3 }]);
        expect(sorted.raw).toEqual([{ x: 5 }, { x: 4 }, { x: 3 }, { x: -2 }, { x: -3 }]);
    });
    it('watch object replace + ensure object mapper is work', function () {
        const orig = list[3];
        const osmap = mappedSimple.get(3);
        const omap = mappedObj.get(3);
        list[3] = { x: 6 };
        expect(mappedSimple.raw).toEqual([{ a: -3 }, { a: 5 }, { a: -2 }, { a: 6 }, { a: 3 }]);
        expect(mappedObj.raw).toEqual([{ a: -3 }, { a: 5 }, { a: -2 }, { a: 6 }, { a: 3 }]);
        expect(filtered.raw).toEqual([{ x: 5 }, { x: 6 }, { x: 3 }]);
        expect(sorted.raw).toEqual([{ x: 6 }, { x: 5 }, { x: 3 }, { x: -2 }, { x: -3 }]);
        /**
         * This is the difference between simple vs with obj mapper
         *
         * ListViewMapped with obj mapper will use previously stored value
         * to not waste resource for recreating value each update or insert
         *
         * The problem however, when the object is removed from the list and
         * is updated while not being observed, the previous object won't be
         * up to date with current value, that's why remapper must be specified
         * to ensure current value is up to date with actual object
         */
        orig.x = 9;
        list[3] = orig;
        expect(mappedSimple.raw).toEqual([{ a: -3 }, { a: 5 }, { a: -2 }, { a: 9 }, { a: 3 }]);
        expect(mappedObj.raw).toEqual([{ a: -3 }, { a: 5 }, { a: -2 }, { a: 9 }, { a: 3 }]);
        expect(filtered.raw).toEqual([{ x: 5 }, { x: 9 }, { x: 3 }]);
        expect(sorted.raw).toEqual([{ x: 9 }, { x: 5 }, { x: 3 }, { x: -2 }, { x: -3 }]);
        /**
         * As seen here, mappedObj remember the previous value
         * based on previous object stored while mappedSimple
         * simply create new object regardless the object.
         * Simple but a little costly
         */
        expect(mappedSimple.get(3)).not.toBe(osmap);
        expect(mappedObj.get(3)).toBe(omap);
    });
    it('watch deleted without sweat', function () {
        list.pop();
        expect(mappedSimple.raw).toEqual([{ a: -3 }, { a: 5 }, { a: -2 }, { a: 9 }]);
        expect(mappedObj.raw).toEqual([{ a: -3 }, { a: 5 }, { a: -2 }, { a: 9 }]);
        expect(filtered.raw).toEqual([{ x: 5 }, { x: 9 }]);
        expect(sorted.raw).toEqual([{ x: 9 }, { x: 5 }, { x: -2 }, { x: -3 }]);
    });
    it('watch inserted without effort', function () {
        list.push({ x: 1_000_000 });
        expect(mappedSimple.raw).toEqual([
            { a: -3 },
            { a: 5 },
            { a: -2 },
            { a: 9 },
            { a: 1_000_000 }
        ]);
        expect(mappedObj.raw).toEqual([{ a: -3 }, { a: 5 }, { a: -2 }, { a: 9 }, { a: 1_000_000 }]);
        expect(filtered.raw).toEqual([{ x: 5 }, { x: 9 }, { x: 1_000_000 }]);
        expect(sorted.raw).toEqual([{ x: 1_000_000 }, { x: 9 }, { x: 5 }, { x: -2 }, { x: -3 }]);
    });
});
