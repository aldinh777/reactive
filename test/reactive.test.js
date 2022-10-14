const { state, observe } = require('../util');

describe('Reactivity', function () {
    const hello = state('');
    const undef = state();
    it('Initialization', function () {
        hello.value = 'hello';
        expect(hello.value).toBe('hello');
        expect(undef.value).toBe(undefined);
    });
    it('Value Update', function () {
        hello.value = 'hi';
        expect(hello.value).toBe('hi');
        hello.value = undefined;
        expect(hello.value).toBe(undefined);
    });
    it('Subscription', function () {
        hello.value = 'hello';
        const helloWorld = state('');
        observe(hello, (val) => (helloWorld.value = val + ' world!'));
        expect(helloWorld.value).toBe('hello world!');
        hello.value = 'hi';
        expect(helloWorld.value).toBe('hi world!');
    });
});

describe('Observability', function () {
    it('Observation', function (done) {
        const hello = state('hello');
        hello.addListener((val) => {
            expect(val).toBe('yes');
            done();
        });
        hello.value = 'yes';
    });
    it('Subscriber Update', function (done) {
        const hello = state('hello');
        const helloMaster = state('');
        observe(hello, (val) => (helloMaster.value = val + ' master!'));
        helloMaster.addListener((val) => {
            expect(val).toBe('yes master!');
            done();
        });
        hello.value = 'yes';
    });
    it('Immediate Observe', function (done) {
        const hello = state('hello');
        observe(hello, (val) => {
            expect(val).toBe('hello');
            done();
        });
    });
    it('Conditional Observe', function (done) {
        const hello = state('hello');
        hello.addListener((val) => {
            if (val.length === 6) {
                expect(val.length).toBe(6);
                done();
            }
        });
        hello.value = 'ninja';
        hello.value = 'hatori';
    });
    it('On Equals', function (done) {
        const hello = state('hello');
        observe(hello, (val) => {
            if (val === 'hello') {
                expect(val).toBe('hello');
                done();
            }
        });
    });
    it('Object Property Binding', function () {
        const obj = { attr1: 'jazzie', attr2: 'joggie' };
        const hello = state('hello');
        observe(hello, (val) => {
            obj.attr1 = val;
            obj.attr2 = val + ' world!';
        });
        expect(obj.attr1).toBe(hello.value);
        expect(obj.attr2).toBe('hello world!');
        hello.value = 'yahoo';
        expect(obj.attr1).toBe('yahoo');
        expect(obj.attr2).toBe('yahoo world!');
    });
    it('Unsubscribe', function () {
        const obj = { attr: 'jazzie' };
        const hello = state('hello');
        const sub = hello.addListener((val) => {
            obj.attr = val;
            throw Error('State not unsubscribed');
        });
        sub.unsub();
        hello.value = 'hi';
        hello.value = 'hatori';
        expect(obj.attr).not.toBe(hello.value);
    });
    it('Resubscribe', function () {
        let samp = '';
        const hello = state('hello');
        const sub = hello.addListener((val) => {
            samp = val;
        });
        sub.unsub();
        sub.resub();
        hello.value = 'moola';
        expect(samp).toBe(hello.value);
    });
    it('Old Value Checking', function () {
        const hello = state('hello');
        let prev = hello.value;
        hello.onChange((_next, oldValue) => {
            expect(oldValue).toBe(prev);
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
        expect(a.value).toBe('mama');
        a.value = 'mamamia';
        expect(a.value).toBe('mama');
        a.value = 'papa';
        expect(a.value).toBe('papa');
    });
});
