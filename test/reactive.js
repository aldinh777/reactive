const { equal, fail, notEqual } = require('assert');
const { state, observe } = require('../util');

describe('Reactivity', function () {
    const hello = state('');
    const undef = state();
    it('Initialization', function () {
        hello.value = 'hello';
        equal(hello.value, 'hello');
        equal(undef.value, undefined);
    });
    it('Value Update', function () {
        hello.value = 'hi';
        equal(hello.value, 'hi');
        hello.value = undefined;
        equal(hello.value, undefined);
    });
    it('Subscription', function () {
        hello.value = 'hello';
        const helloWorld = state('');
        observe(hello, val => helloWorld.value = val + ' world!')
        equal(helloWorld.value, 'hello world!');
        hello.value = 'hi';
        equal(helloWorld.value, 'hi world!');
    });
});

describe('Observability', function () {
    it('Observation', async function (done) {
        const hello = state('hello');
        hello.addListener(val => {
            equal(val, 'yes');
            done();
        });
        hello.value = 'yes';
    });
    it('Subscriber Update', async function (done) {
        const hello = state('hello');
        const helloMaster = state('');
        observe(hello, val => helloMaster.value = val + ' master!')
        helloMaster.addListener(val => {
            equal(val, 'yes master!');
            done();
        });
        hello.value = 'yes';
    });
    it('Immediate Observe', async function (done) {
        const hello = state('hello');
        observe(hello, val => {
            equal(val, 'hello');
            done();
        });
    });
    it('Conditional Observe', async function (done) {
        const hello = state('hello');
        hello.addListener(val => {
            if (val.length === 6) {
                equal(val.length, 6);
                done();
            }
        });
        hello.value = 'ninja';
        hello.value = 'hatori';
    });
    it('On Equals', async function (done) {
        const hello = state('hello');
        observe(hello, val => {
            if (val === 'hello') {
                equal(val, 'hello');
                done();
            }
        });
    });
    it('Object Property Binding', function () {
        const obj = { attr1: 'jazzie', attr2: 'joggie' };
        const hello = state('hello');
        observe(hello, val => {
            obj.attr1 = val;
            obj.attr2 = val + ' world!';
        });
        equal(obj.attr1, hello.value);
        equal(obj.attr2, 'hello world!');
        hello.value = 'yahoo';
        equal(obj.attr1, 'yahoo');
        equal(obj.attr2, 'yahoo world!');
    });
    it('Unsubscribe', function () {
        const obj = { attr: 'jazzie' };
        const hello = state('hello');
        const sub = hello.addListener((val) => {
            obj.attr = val;
            fail('State not unsubscribed');
        });
        sub.unsub();
        hello.value = 'hi';
        hello.value = 'hatori';
        notEqual(obj.attr, hello.value);
    });
    it('Resubscribe', function () {
        let samp = '';
        const hello = state('hello');
        const sub = hello.addListener(val => {
            samp = val;
        });
        sub.unsub();
        sub.resub();
        hello.value = 'moola'
        equal(samp, hello.value);
    });
    it('Old Value Checking', function () {
        const hello = state('hello');
        let prev = hello.value;
        hello.onChange((_next, oldValue) => {
            equal(oldValue, prev);
        });
        hello.value = 'story';
        prev = hello.value;
        hello.value = 'jojoh';
    });
    it('Update Cancellation', function () {
        const a = state('hello');
        a.onChange((val, prev) => {
            if (val.length > 6) {
                a.value = prev;
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
