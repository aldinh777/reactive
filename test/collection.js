const { equal, fail, deepEqual } = require('assert');
const { statelist, statemap } = require('../util/collection');

const sum = (prev, next) => prev + next;

describe('State List', function () {
    const list = statelist([1, 2, 3, 4, 5]);
    it('Update', function () {
        let updateCounter = 0;
        let nextSum = 0;
        let prevSum = 0;
        list.onUpdate((_, next, prev) => {
            updateCounter++;
            nextSum += next;
            prevSum += prev;
        });
        const array = list.raw;
        for (let i = 0; i < array.length; i++) {
            list[i]++;
        }
        equal(updateCounter, array.length);
        equal(prevSum, [1, 2, 3, 4, 5].reduce(sum));
        equal(nextSum, [2, 3, 4, 5, 6].reduce(sum))
    });
    describe('Delete', function () {
        // current value = [2, 3, 4, 5, 6]
        let deleteCounter = 0;
        let deleteSum = 0;
        list.onDelete((_, deleted) => {
            deleteCounter++;
            deleteSum += deleted;
        });
        it('splice', function () {
            // aftermath [2, 5, 6] | spliced [3, 4]
            const spliced = list.splice(1, 2);
            equal(spliced.length, 2);
            deepEqual(spliced, [3, 4]);
        });
        it('pop', function () {
            // aftermath [2, 5] | popped -> 6
            const popped = list.pop();
            equal(popped, 6);
        });
        it('shift', function () {
            // aftermath [5] | shifted -> 2
            const shifted = list.shift();
            equal(shifted, 2);
        });
        it('aftermath', function () {
            // deleteds [2, 3, 4, 6]
            equal(deleteCounter, 4);
            equal(deleteSum, [2, 3, 4, 6].reduce(sum));
            // current [5]
            equal(list[0], 5);
        });
    });
    describe('Insert', function () {
        // current [5]
        let insertCounter = 0;
        let insertSum = 0;
        list.onInsert((_, inserted) => {
            insertCounter++;
            insertSum += inserted;
        });
        it('push', function () {
            // aftermath [5, 1, 2] | newlength -> 3
            let newlength = list.push(1, 2);
            equal(newlength, 3);
        });
        it('unshift', function () {
            // aftermath [3, 4, 5, 1, 2] | newlength -> 5
            newlength = list.unshift(3, 4);
            equal(newlength, 5);
        });
        it('splice', function () {
            // aftermath [3, 4, 5, 6, 7, 1, 2]
            list.splice(3, 0, 6, 7);
        });
        it('aftermath', function () {
            const expected = [3, 4, 5, 6, 7, 1, 2];
            const inserteds = [1, 2, 3, 4, 6, 7];
            deepEqual(list.raw, expected);
            equal(insertCounter, inserteds.length);
            equal(insertSum, inserteds.reduce(sum));
        });
    });
    describe('Unsubscribe', function () {
        const testlist = statelist([1, 2, 3, 4, 5]);
        it('update', function () {
            const updsubs = testlist.onUpdate(() => fail('List Update Listener not removed'));
            updsubs.unsub();
            testlist[0] = 0;
        });
        it('delete', function () {
            const delsubs = testlist.onDelete(() => fail('List Delete Listener not removed'))
            delsubs.unsub();
            testlist.splice(0, 1);
            testlist.pop();
            testlist.shift();
        });
        it('insert', function () {
            const inssubs = testlist.onDelete(() => fail('List Insert Listener not removed'))
            inssubs.unsub();
            testlist.push(0);
            testlist.unshift(0);
            testlist.splice(0, 0, 0);
        });
    });
    describe('Resubscribe', function () {
        const testlist = statelist([1, 2, 3, 4, 5]);
        it('update', async function (done) {
            const updsubs = testlist.onUpdate(() => done());
            updsubs.unsub();
            updsubs.resub();
            testlist[0] = 0;
        });
        it('delete', function (done) {
            const delsubs = testlist.onDelete(() => done());
            delsubs.unsub();
            delsubs.resub();
            testlist.pop();
        });
        it('insert', function (done) {
            const inssubs = testlist.onInsert(() => done());
            inssubs.unsub();
            inssubs.resub();
            testlist.push(0);
        });
    });
});

describe('State Map', function () {
    const map = statemap({ a: 0 });
    it('Update', async function (done) {
        map.onUpdate((key, val) => {
            if (key === 'a' && val === 10) {
                done();
            }
        });
        map.a = 10;
    });
    it('Insert', async function (done) {
        map.onInsert((key, val) => {
            if (key === 'moo' && val === 20) {
                done();
            }
        });
        map.moo = 20;
    });
    it('Delete', async function (done) {
        map.onDelete((key, val) => {
            if (key === 'moo' && val === 20) {
                done();
            }
        });
        map.delete('moo');
    });
    describe('Unsubscribe', function () {
        const testmap = statemap({ a: 0 });
        it('update', function () {
            const sub = testmap.onUpdate(() => fail('Map Update Listener not removed'));
            sub.unsub();
            testmap.a = 10;
        });
        it('insert', function () {
            const sub = testmap.onInsert(() => fail('Map Insert Listener not removed'));
            sub.unsub();
            testmap.moo = 20;
        });
        it('delete', function () {
            const sub = testmap.onDelete(() => fail('Map Delete Listener not removed'));
            sub.unsub();
            testmap.delete('moo');
        });
    });
    describe('Resubscribe', function () {
        const testmap = statemap({ a: 0 });
        it('update', async function (done) {
            const sub = testmap.onUpdate(() => done());
            sub.unsub();
            sub.resub();
            testmap.a = 10;
        });
        it('insert', function (done) {
            const sub = testmap.onInsert(() => done());
            sub.unsub();
            sub.resub();
            testmap.moo = 20;
        });
        it('delete', function (done) {
            const sub = testmap.onDelete(() => done());
            sub.unsub();
            sub.resub();
            testmap.delete('moo');
        });
    })
});
