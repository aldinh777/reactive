# Reactive

Another attempt to implement Reactive Programming with Javascript

## Why?

> Because reactive programming is just amazing!

## Guide

### Data Binding

Imagine two variable, one depends on the other one

`a = 5`

`b = a * 2 // the value of b will be 10`

In Procedural Programming, changing the value of `a` won't affect the value of `b`. But in Reactive Programming, any change of `a` would directly affect the value of `b`

`a = 6 // the value of b then will become 12 explicitly`

This is how we acquire the same effect using this library

```js
import { state } from '@aldinh777/reactive';
import { stateFrom } from '@aldinh777/reactive/state/utils';

const a = state(5);
const b = stateFrom(a)((a) => a * 2);

console.log('current value = ', b());
// output: current value = 10

a(6);

console.log('current value = ', b());
// output: current value = 12
```

### Observability

Let say we want to check if some data is greater than 10

```js
a = 5;
if (a > 10) {
    print('A is CHANGED');
}
```

In Procedural Programming, this will only check once. Changing the value of `a` won't do the check anymore. in Reactive, there is a way to always check the value of `a` whenever it changes. But to make it easier to understand, let assume we have a new keyword called `when`

```js
a = 5
when (a > 10) {
    print('the current value of A is GREATER THAN 10')
}
```

Now, any changes to `a` will trigger check and only run the command only when the current value is larger than 10

```js
a = 11; // the current value of A is GREATER THAN 10
a = 9;  // --- will not do anything ---
a = 15; // the current value of A is GREATER THAN 10
```

This is how we obtain the same effect using this library

```js
const { state } = require('@aldinh777/reactive');

const a = state(5);
a.onChange((val) => {
    if (val > 10) {
        console.log('the current value of A is GREATER THAN 10');
    }
});

a(10); // the current value of A is GREATER THAN 10
a(9);  // --- will not do anything ---
a(15); // the current value of A is GREATER THAN 10
```

### That's it! for now

That was basically the main idea of this library
