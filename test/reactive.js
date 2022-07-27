const { equal, fail, notEqual } = require('assert');
const { reactive, observe } = require('../dist');

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
        const b = reactive('');
        observe(a, val => b.value = val + ' world!')
        equal(b.value, 'hello world!');
        a.value = 'hi';
        equal(b.value, 'hi world!');
        b.value = 'reset';
        equal(b.value, 'reset');
    });
    it('External Subscription', function () {
        // Reactive not even required!!!
        let x = 'hello';
        const a = () => x + ' world!';
        equal(a(), 'hello world!');
        x = 'hi';
        equal(a(), 'hi world!');
    });
});

describe('Observability', function () {
    it('Observation', async function (done) {
        const a = reactive('hello');
        a.addListener(val => {
            equal(val, 'yes');
            done();
        });
        a.value = 'yes';
    });
    it('Subscriber Update', async function (done) {
        const a = reactive('hello');
        const b = reactive('');
        observe(a, val => b.value = val + ' master!')
        b.addListener(val => {
            equal(val, 'yes master!');
            done();
        });
        a.value = 'yes';
    });
    it('Immediate Observe', async function (done) {
        const a = reactive('hello');
        observe(a, val => {
            equal(val, 'hello');
            done();
        });
    });
    it('Conditional Observe', async function (done) {
        const a = reactive('hello');
        a.addListener(val => {
            if (val.length === 6) {
                equal(val.length, 6);
                done();
            }
        });
        a.value = 'ninja';
        a.value = 'hatori';
    });
    it('OnEquals', async function (done) {
        const a = reactive('hello');
        observe(a, val => {
            if (val === 'hello') {
                equal(val, 'hello');
                done();
            }
        });
    });
    it('Value Binding', function () {
        const obj = { attr1: 'jazzie', attr2: 'joggie' };
        const a = reactive('hello');
        observe(a, val => {
            obj.attr1 = val;
            obj.attr2 = val + ' world!';
        });
        equal(obj.attr1, a.value);
        equal(obj.attr2, 'hello world!');
        a.value = 'yahoo';
        equal(obj.attr1, 'yahoo');
        equal(obj.attr2, 'yahoo world!');
    });
    it('Unsubscribe', function () {
        const obj = { attr: 'jazzie' };
        const a = reactive('hello');
        const update = a.addListener(() => fail());
        update.unsubscribe();
        a.value = 'hi';
        a.value = 'hatori';
        notEqual(obj.attr, a.value);
    });
    it('Old Value Checking', function () {
        const a = reactive('hello');
        let oldValue = a.value;
        let prev = a.value;
        a.addListener(val => {
            equal(oldValue, prev);
            // This should do, old value doesn't necessary used anyways
            oldValue = val
        });
        a.value = 'story';
        prev = a.value;
        a.value = 'jojoh';
    });
    it('Update Cancellation', function () {
        const a = reactive('hello');
        let oldValue = a.value;
        a.addListener(val => {
            if (val.length > 6) {
                a.value = oldValue
            } else {
                oldValue = val
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
