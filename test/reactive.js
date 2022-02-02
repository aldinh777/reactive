const { equal, fail, notEqual } = require('assert');
const { reactive } = require('../dist');

describe('Reactivity', function () {
    it('Initialization', function () {
        const a = reactive('hello');
        const undef = reactive();
        equal(a.value, 'hello');
        equal(undef.value, undefined);
    });
    it('Value Update', function () {
        const a = reactive('hello');
        a.value = 'hi';
        equal(a.value, 'hi');
        a.value = undefined;
        equal(a.value, undefined);
    });
    it('Subscription', function () {
        const a = reactive('hello');
        const b = reactive(a => a + ' world!', a);
        equal(b.value, 'hello world!');
        a.value = 'hi';
        equal(b.value, 'hi world!');
        b.value = 'reset';
        equal(b.value, 'reset');
    });
    it('External Subscription', function () {
        let x = 'hello';
        const a = reactive(() => x + ' world!');
        equal(a.value, 'hello world!');
        x = 'hi';
        equal(a.value, 'hi world!');
    });
});

describe('Observability', function () {
    it('Observation', async function (done) {
        const a = reactive('hello');
        a.onChange(val => {
            equal(val, 'yes');
            done();
        });
        a.value = 'yes';
    });
    it('Subscriber Update', async function (done) {
        const a = reactive('hello');
        const b = reactive(a => a + ' master!', a);
        b.onChange(val => {
            equal(val, 'yes master!');
            done();
        });
        a.value = 'yes';
    });
    it('Immediate Observe', async function (done) {
        const a = reactive('hello');
        a.onChange(val => {
            equal(val, 'hello');
            done();
        }, true);
    });
    it('Conditional Observe', async function (done) {
        const a = reactive('hello');
        a.when(a => a.length === 6, val => {
            equal(val.length, 6);
            done();
        });
        a.value = 'ninja';
        a.value = 'hatori';
    });
    it('OnEquals', async function (done) {
        const a = reactive('hello');
        a.onEquals('hello', val => {
            equal(val, 'hello');
            done();
        });
    });
    it('Value Binding', function () {
        const obj = { attr1: 'jazzie', attr2: 'joggie' };
        const a = reactive('hello');
        a.bindValue(obj, 'attr1');
        a.bindValue(obj, 'attr2', x => x + ' world!');
        equal(obj.attr1, a.value);
        equal(obj.attr2, 'hello world!');
        a.value = 'yahoo';
        equal(obj.attr1, 'yahoo');
        equal(obj.attr2, 'yahoo world!');
    });
    it('Unsubscribe', function () {
        const obj = { attr: 'jazzie' };
        const a = reactive('hello');
        const change = a.onChange(() => fail());
        const equalsHi = a.onEquals('hi', () => fail());
        const when = a.when(a => a.length === 6, () => fail());
        const bind = a.bindValue(obj, 'attr');
        change.unsubscribe();
        equalsHi.unsubscribe();
        when.unsubscribe();
        bind.unsubscribe();
        a.value = 'hi';
        a.value = 'hatori';
        notEqual(obj.attr, a.value);
    });
    it('Old Value Checking', function () {
        const a = reactive('hello');
        let prev = a.value;
        a.onChange((_, ev) => {
            equal(ev.oldValue, prev);
        });
        a.value = 'story';
        prev = a.value;
        a.value = 'jojoh';
    });
    it('Update Cancellation', function () {
        const a = reactive('hello');
        a.onChange((val, ev) => {
            if (val.length > 6) {
                ev.cancel();
            }
        });
        a.value = 'mama';
        equal(a.value, 'mama');
        a.value = 'mamamia';
        equal(a.value, 'mama');
        a.value = 'papa';
        equal(a.value, 'papa');
    });
});
