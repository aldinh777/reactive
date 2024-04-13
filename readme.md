# Reactive

Another attempt to implement Reactive Programming with Javascript

## Guide

### Introduction

Reactivity is the ability of something to be reactive, and to be reactive means something can always react to something else. In case of Computer Science, it usually means the ability of something to react to any changes of data

There is many ways to implement this behaviour, ReactiveX like to call this behaviour as `Observable`, and many other call it `Signal`, but i always love to imagine it as `State`

a `State` always have a value, and its value can and will changes overtime to be observed later throughout the changes. In another word, it just a value wrapper with the ability to be observable

Lets start simple, this is how you create a state, simple and straighforward

```js
import { state } from '@aldinh777/reactive';

const x = state(0);
```

now the variable `x` is a state with its current value is 0. to update its value, just call the variable as a function with an argument, and to get the current value, just call
it without an argument

```js
import { state } from '@aldinh777/reactive';

const x = state(0);

console.log(x()); // 0
x(4); // set the current value to 4
console.log(x()); // 4
```

### Data Binding

Imagine two variable, one depends on the other one

```py
# Procedural Simulation
a = 5
b = a * 2   # the value of b will be 10
print(a)    # 5
print(b)    # 10

a = 6
print(a)    # 6
print(b)    # 10
```

In the classical world Procedural Programming, changing the value of `a` won't affect the value of `b`. But in Reactive Programming, any change of `a` would directly affect the value of `b`, this ability is usually called `binding`. For the sake of clarity, lets just assume we have our own operator which is (`<-`) to bind any states

```py
# Reactive Simulation
a = 5
b <- a * 2  # the value of b will be whatever the value of a at the moment times 2
print(a)    # 5
print(b)    # 10

a = 6
print(a)    # 6
print(b)    # 12
```

This is how we acquire the same effect using this library

```js
import { state } from '@aldinh777/reactive';
import { mutated } from '@aldinh777/reactive/utils';

const a = state(5);
const b = mutatedFrom(a)((a) => a * 2);

console.log('current value = ', b());
// output: current value = 10

a(6);

console.log('current value = ', b());
// output: current value = 12
```

### Observable

Let say we want to check if some data is greater than 10

```py
# Procedural Simulation
a = 5
if (a > 10) {
    print('A is CHANGED')
}

a = 11  # (nothing happened...)
a = 9   # (nothing happened...)
a = 15  # (nothing happened...)
```

In Procedural Programming, this will only check once. Changing the value of `a` won't do the check anymore. in Reactive, there is a way to always check the value of `a` whenever it changes. But to make it easier to understand, let assume we have a new keyword called `when`

```py
# Reactive Simulation
a = 5
when (a > 10) {
    print('A is currently GREATER THAN 10')
}

a = 11  # A is currently GREATER THAN 10
a = 9   # (nothing happened...)
a = 15  # A is currently GREATER THAN 10
```

Now, any changes to `a` will trigger check and only run the command only when the current value is larger than 10

This is how we obtain the same effect using this library

```js
import { state } from '@aldinh777/reactive';

const a = state(5);
a.onChange((val) => {
    if (val > 10) {
        console.log('A is currently GREATER THAN 10');
    }
});

a(10); // A is currently GREATER THAN 10
a(9); // (nothing happened...)
a(15); // A is currently GREATER THAN 10
```

if there is multiple state to be observed, you can use the `effectFrom` method from `utils`

```js
import { state } from '@aldinh777/reactive';
import { effect } from '@aldinh777/reactive/utils';

const a = state(2);
const b = state(3);

effectFrom(a, b)((a, b) => {
    if (a + b > 10) {
        console.log(`A and B combined which is ${a + b} is GREATER THAN 10`);
    }
});

a(8); // A and B combined which is 11 is GREATER THAN 10
a(5); // (nothing happened...)
b(7); // A and B combined which is 12 is GREATER THAN 10
```

### That's it! for now

That was basically the main idea of this library
