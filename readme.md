# Reactive
Another attempt to implement Reactive Programming with Javascript

## Why?
> Because Reactive Programming is cool!

Basically, that's the reason

## Guide
### Data Binding
Imagine two variable, one depends on the other one

`a = 5`

`b = a + 1 // the value of b will be 6`

In your usual Procedural Programming, changing the value of `a` won't affect the value of `b`. But in Reactive, any change of `a` would directly affect the value of `b`

`a = 10 // the value of b will be 11`

This is how we do it in this library

```js
const { reactive, observe } = require('reactive');

const a = reactive(5);
const b = reactive(0);
observe(a, val => b.value = val + 1)

console.log(b.value); // 6
a.value = 10;
console.log(b.value); // 11
```
### Observability
Let say we want to check if a variable is greater than 10

```kt
a = 5
if (a > 10) {
    print('A is OVERLOADED')
}
```

In Procedural Programming, this will only check once. Changing the value of `a` won't do check anymore. in Reactive, there is a way to always check the value of `a` whenever it changes. But to make it easier to understand, let assume we have a new keyword called `when`

```kt
a = 5
when (a > 10) {
    print('A is OVERLOADED')
}
```
Now, any changes to `a` will trigger check

```kt
a = 11 // A is OVERLOADED
a = 9  //
a = 15 // A is OVERLOADED
```

This is how we obtain the same effect in this library

```js
const { reactive } = require('reactive');

const a = reactive(5);
a.addListener(val => {
    if (val > 10) {
        console.log('A is OVERLOADED');
    }
});

a.value = 11 // A is OVERLOADED
a.value = 9  //
a.value = 15 // A is OVERLOADED
```

### That's it! for now
That was basically the main idea of this library

Previous version actually have too many functionality such as acquiring the old value a reactive, update cancellation, and reactive collections. However, all of them doesn't feel necessary, so i trimmed as many as i can and this is the result.