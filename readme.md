# Reactive
Another attempt to implement Reactive Programming with Javascript or precisely Typescript

## Why?
No particular reason. I just blown away by the idea of Reactive Paradigm i watch on youtube

The idea of a variable bounded with another variable, is weirdly interresting, also the ability to observe the variable when the value changes. It's not much of a feature but it really get me excited!

__I Wanna TRY Writing Reactive Code And Make it EXLPODE!__

There is plenty implementation of Reactive Programming, but i found none that doing it exactly the way that i expected. Some are mixing it with Functional Programming, like RXJS and BaconJs, and some are web specific, like Svelte and SolidJs

__"Okay then, i'll write it myself"__

It won't be as great as others, but it would be just what i expected Reactive Programming is about. State Management with a lot of abstraction and a little bit of unpredictability and probably some unknown chaos hiding inside

## Guide
### Data Binding
Imagine two variable, one depends on the other one

`a = 5`

`b = a + 1 // the value of b will be 6`

In your usual Procedural Programming, changing the value of `a` won't affect the value of `b`. But in Reactive, any change of `a` would directly affect the value of `b`

`a = 10 // the value of b will be 11`

This is how we do it in this library

```js
const { reactive } = require('reactive');

const a = reactive(5);
const b = reactive((val) => val + 1, a);

console.log(b.value); // 6
a.value = 10;
console.log(b.value); // 11
```
### Observability
Let say we want to check if a variable is greater than 10

```
a = 5
if (a > 10) {
    print('A is OVERLOADED')
}
```

In Procedural Programming, this will only check once. Changing the value of `a` won't do check anymore. in Reactive, there is a way to always check the value of `a` whenever it changes. But to make it easier to understand, let assume we have a new keyword called `when`

```
a = 5
when (a > 10) {
    print('A is OVERLOADED')
}
```
Now, any changes to `a` will trigger check

```
a = 11 // A is OVERLOADED
a = 9  //
a = 15 // A is OVERLOADED
```

This is how we obtain the same effect in this library

```js
const { reactive } = require('reactive');

const a = reactive(5);
a.when((val) => val > 10, () => {
    console.log('A is OVERLOADED');
});

a.value = 11 // A is OVERLOADED
a.value = 9  //
a.value = 15 // A is OVERLOADED
```
Or you could just simply observe the value change without even doing a single check

```js
const { reactive } = require('reactive');

const a = reactive(5);
a.onChange(() => {
    console.log('A is CHANGED');
});

a.value = 11; // A is CHANGED
a.value = 9;  // A is CHANGED
a.value = 9;  //
a.value = 15; // A is CHANGED
```
### Update Cancellation
With previous knowledge, you learn that you can observe any changes of value. You could also prevent the value from changing by cancelling it
```js
const { reactive } = require('reactive');

const a = reactive(5);
a.onChange((val, ev) => {
    if (val < ev.oldValue) {
        ev.cancel();
    }
});

a.value = 9;
console.log(a.value);   // 9

a.value = 8;            // Won't change
console.log(a.value);   // 9

a.value = 10;
console.log(a.value);   // 10
```
### That's it! for now
That was basically the main idea of this library

Actually, there is more, but other than what is explained here, they are still experimental. There is a reason why the version name is `0.*.*-unstable`
