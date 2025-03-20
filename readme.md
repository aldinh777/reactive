# Reactive

Another attempt to implement Reactive Programming with Javascript to achieve the **Ultimate Reactivity**

## State

The very fundamental of Reactivity

### Introduction

Reactivity is the ability of something to be reactive, and to be reactive means something is capable to react to something else. In Computer Science, it usually means the ability of something to react to any changes of data

There is many ways to implement this behaviour, ReactiveX like to call this behaviour as `Observable`, and many other call it `Signal`, but i always love to imagine it as `State`

a `State` always have a value, and its value can and will changes overtime to be observed later throughout the changes. In another word, it just a value wrapper with the ability to be observable

Lets start simple, this is how to create a `State`

```js
import { state } from '@aldinh777/reactive';

const x = state(0);
```

now the variable `x` is a state with its current value is 0. to update its value, just call the variable as a function with an argument, and to get the current value, just call
it without an argument

```js
import { state } from '@aldinh777/reactive';

const x = state(0);

console.log(x.getValue()); // 0
x.setValue(4); // set the current value to 4
console.log(x.getValue()); // 4
```

### Binding

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

In the classical world Procedural Programming, changing the value of `a` won't affect the value of `b`. But in Reactive Programming, any change of `a` would directly affect the value of `b`, this ability is usually called `binding`. For the sake of clarity, lets just assume we have our own operator called (`<-`) to bind any states

```py
# Reactive Simulation
a = 5
b <- a * 2  # the value of b will become whatever the value of a at the moment times 2
print(a)    # 5
print(b)    # 10

a = 6
print(a)    # 6
print(b)    # 12
```

This is how we acquire the same effect using this library

```js
import { state, computed } from '@aldinh777/reactive';

const a = state(5);
const b = computed((a) => a * 2, [a]); // mark `a` as dependency

console.log('current value = ', b.getValue());
// output: current value = 10

a.setValue(6);

console.log('current value = ', b.getValue());
// output: current value = 12
```

The dependency could also be infered by usage without explicitly specifying the dependency array

```js
const a = state(5);
const b = computed(() => a.getValue() * 2); // will automatically mark `a` as dependency
```

### Observable

Let say we want to check if some data is greater than 10

```py
# Procedural Simulation
a = 5
if (a > 10) {
    print('A is currently GREATER THAN 10')
}

a = 11  # (nothing happened...)
a = 9   # (nothing happened...)
a = 15  # (nothing happened...)
```

In Procedural Programming, this if condition will only check once. Changing the value of `a` won't do the check anymore. in Reactive, there is a way to always check the value of `a` whenever it changes. To make it easier to understand, let assume we have a new keyword called `when`

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
a.onChange((nextValue) => {
    if (nextValue > 10) {
        console.log('A is currently GREATER THAN 10');
    }
});

a.setValue(11); // A is currently GREATER THAN 10
a.setValue(9); // (nothing happened...)
a.setValue(15); // A is currently GREATER THAN 10
```

if there is multiple state to be observed, use the `setEffect` method

```js
import { state, setEffect } from '@aldinh777/reactive';

const a = state(2);
const b = state(3);

setEffect(
    (a, b) => {
        if (a + b > 10) {
            console.log(`A and B combined which is ${a + b} is GREATER THAN 10`);
        }
    },
    [a, b]
); // mark `a` and `b` as dependencies

a.setValue(8); // A and B combined which is 11 is GREATER THAN 10
a.setValue(5); // (nothing happened...)
b.setValue(7); // A and B combined which is 12 is GREATER THAN 10
```

just as how `computed` works, `setEffect` could also infer its dependencies by usage

```js
const a = state(2);
const b = state(3);

setEffect(() => {
    if (a.getValue() + b.getValue() > 10) {
        console.log(`A and B combined which is ${a() + b()} is GREATER THAN 10`);
    }
}); // automatically infer `a` and `b` as dependencies
```

## Watchable List

Like state, but array

### Array & Object

When it comes to data structure, State itself can also be used to wrap an object or array. However, state only track value changes, not the property update, so when the content of an object inside a state were being updated, it wont be tracked.

```ts
const list = state([1, 2, 3]);
const obj = state({ name: 'albert', mom: 'pauline' });

list.onChange(() => console.log('list updated'));
obj.onChange(() => console.log('object updated'));

list.getValue().push(4); // wont be tracked
obj.getValue().name = 'alberto'; // also wont be tracked
```

For the object however, there is a workaround by using state as its property value

```ts
const obj = { name: state('albert'), mom: state('pauline') };

obj.name.onChange(() => console.log('name changed'));

obj.name.setValue('alberto'); // name changed
```

However, an array is a different data structure and have different set of operations. Even if we uses state as its value, what we can track are only the value `update`. Beside updates, array can also do `insert` and `delete` through `push`, `pop`, `shift`, `unshift` and `splice` methods.

### ReactiveList

`ReactiveList` are made to handle reactivity within an array

```ts
import { list } from '@aldinh777/reactive/list';

const numbers = list([1, 2, 3, 4]);

// track content update
numbers.onUpdate((index, next, prev) => {});
numbers.set(0, 5); // update tracked with; index = 0, next = 5, prev = 1

// track content insert
numbers.onInsert((index, inserted, last) => {});
numbers.push(6); // insert tracked with; index = 4, inserted = 6, last = true

// track content delete
numbers.onDelete((index, deleted) => {
    console.log(`deleted at ${index} with value ${deleted}`);
});
numbers.pop(); // delete tracked with; index = 4, deleted = 6
```

### List Transformation

Another thing that are commonly used from array are content transformation through `filter`, `map` or `sort`. `ReactiveList` can also do that and make the content reactive dependend on its source

```ts
const numbers = list([1, 2, 3, 4]);
const doubled = numbers.map((n) => n * 2);

console.log(numbers.toArray()); // [1, 2, 3, 4]
console.log(doubled.toArray()); // [2, 4, 6, 8]

numbers.push(5);

// mapped list are explicitly inserted
console.log(doubled.toArray()); // [2, 4, 6, 8, 10]

numbers.set(0, 6);

// mapped list are explicitly updated
console.log(doubled.toArray()); // [12, 4, 6, 8, 10]

numbers.pop();

// mapped list are explicitly deleted
console.log(doubled.toArray()); // [12, 4, 6, 8]
```

this also works with `filter` and `sort` and can also be chained

```ts
const numbers = list([4, 3, 6, 2, 5, 7]);
const sortedOdd = numbers
    // sort ascending
    .sort((a, b) => a > b)
    .filter((n) => n % 2 !== 0);

console.log(numbers.toArray()); // [4, 3, 6, 2, 5, 7]
console.log(sortedOdd.toArray()); // [3, 5, 7]

numbers.push(1);
console.log(numbers.toArray()); // [4, 3, 6, 2, 5, 7, 1]
console.log(sortedOdd.toArray()); // [1, 3, 5, 7]

numbers.set(0, 9);
console.log(numbers.toArray()); // [9, 3, 6, 2, 5, 7, 1]
console.log(sortedOdd.toArray()); // [1, 3, 5, 7, 9]

numbers.pop();
console.log(numbers.toArray()); // [9, 3, 6, 2, 5, 7]
console.log(sortedOdd.toArray()); // [3, 5, 7, 9]
```
