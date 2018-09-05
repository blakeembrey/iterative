# Iterative

[![NPM version][npm-image]][npm-url]
[![NPM downloads][downloads-image]][downloads-url]
[![Build status][travis-image]][travis-url]
[![Test coverage][coveralls-image]][coveralls-url]

> Functions for working with iterators in JavaScript, with TypeScript.

_(Inspired by [itertools](https://docs.python.org/3/library/itertools.html#itertools-recipes))_

## Installation

```
npm install iterative --save
```

## Usage

### `range(start = 0, stop = Infinity, step = 1): Iterable<number>`

This is a versatile function to create lists containing arithmetic progressions.

```ts
range() //=> [0, 1, 2, 3, 4, 5, 6, 7, 8, ...]
range(10, 20, 5) //=> [10, 15]
```

### `cycle<T>(iterable: Iterable<T>): Iterable<T>`

Make an iterator returning elements from the iterable and saving a copy of each. When the iterable is exhausted, return elements from the saved copy. Repeats indefinitely.

```ts
cycle([1, 2, 3]) //=> [1, 2, 3, 1, 2, 3, 1, 2, ...]
```

### `repeat<T>(value: T): Iterable<T>`

Make an iterator that repeats `value` over and over again.

```ts
repeat(true) //=> [true, true, true, true, ...]
```

### `flatten<T>(iterable: Iterable<Iterable<T>>): Iterable<T>`

Return an iterator flattening one level of nesting in an iterable of iterables.

```ts
flatten([[1, 2, 3], [4, 5, 6], [7, 8, 9]]) //=> [1, 2, 3, 4, 5, 6, 7, 8, 9]
```

### `chain<T>(...iterables: Array<Iterable<T>>): Iterable<T>`

Make an iterator that returns elements from the first iterable until it is exhausted, then proceeds to the next iterable, until all of the iterables are exhausted. Used for treating consecutive sequences as a single sequence.

```ts
chain([1, 2, 3], [4, 5, 6], [7, 8, 9]) //=> [1, 2, 3, 4, 5, 6, 7, 8, 9]
```

### `slice<T>(iterable: Iterable<T>, start = 0, stop = Infinity, step = 1): Iterable<T>`

Make an iterator that returns selected elements from the `iterable`.

```ts
slice([1, 2, 3, 4, 5]) //=> [1, 2, 3, 4, 5]
slice(range(), 2, 5) //=> [2, 3, 4]
```

### `map<T, U>(iterable: Iterable<T>, func: (x: T) => U): Iterable<U>`

Apply function to every item of iterable and return an iterable of the results.

```ts
map([1, 2, 3], x => x * x) //=> [1, 4, 9]
```

### `spreadmap<T, U>(iterable: Iterable<T>, func: (...args: T) => U): Iterable<U>`

Make an iterator that computes the function using arguments obtained from the iterable. Used instead of `map()` when argument parameters are already grouped in tuples from a single iterable (the data has been "pre-zipped"). The difference between `map()` and `spreadmap()` parallels the distinction between `function(a, b)` and `function(...c)`.

```ts
map([[1, 2], [3, 4], [5, 6]], (a, b) => a + b) //=> [3, 7, 11]
```

### `filter<T, U extends T>(iterable: Iterable<T>, func: Predicate<T, U> = Boolean): Iterable<U>`

Construct an `iterator` from those elements of `iterable` for which `func` returns true.

```ts
filter(range(0, 10), x => x % 2 === 0) //=> [0, 2, 4, 6, 8]
```

### `reduce<T, U>(iterable: Iterable<T>, reducer: Reducer<T, U>, initializer?: U): U`

Apply function of two arguments cumulatively to the items of `iterable`, from left to right, so as to reduce the iterable to a single value.

```ts
reduce([1, 2, 3], (sum, val) => sum + val) //=> 6
```

### `accumulate<T>(iterable: Iterable<T>, func: Reducer<T, T>): Iterable<T>`

Make an iterator that returns accumulated results of binary functions.

```ts
accumulate([1, 2, 3], (sum, val) => sum + val) //=> [1, 3, 6]
```

### `all<T, U extends T>(iterable: Iterable<T>, predicate: Predicate<T, U> = Boolean): boolean`

Returns `true` when all values in iterable are truthy.

```ts
all([1, 2, 3], x => x % 2 === 0) //=> false
```

### `any<T, U extends T>(iterable: Iterable<T>, predicate: Predicate<T, U> = Boolean): boolean`

Returns `true` when any value in iterable are truthy.

```ts
any([1, 2, 3], x => x % 2 === 0) //=> true
```

### `contains<T>(iterable: Iterable<T>, needle: T): boolean`

Returns `true` when any value in iterable is equal to `needle`.

```ts
contains('test', 't') //=> true
```

### `dropWhile<T>(iterable: Iterable<T>, predicate: Predicate<T>): Iterable<T>`

Make an iterator that drops elements from the iterable as long as the predicate is true; afterwards, returns every element.

```ts
dropWhile([1, 2, 3, 4, 5], x => x < 3) //=> [3, 4, 5]
```

### `takeWhile<T>(iterable: Iterable<T>, predicate: Predicate<T>): Iterable<T>`

Make an iterator that returns elements from the iterable as long as the predicate is true.

```ts
takeWhile([1, 2, 3, 4, 5], x => x < 3) //=> [1, 2]
```

### `groupBy<T, U>(iterable: Iterable<T>, func: (x: T) => U): Iterable<[U, Iterable<T>]>`

Make an iterator that returns consecutive keys and groups from the `iterable`. The `func` is a function computing a key value for each element.

```ts
groupBy(range(0, 6), x => Math.floor(x / 2)) //=> [[0, [0, 1]], [1, [2, 3]], [2, [4, 5]]]
```

### `enumerate<T>(iterable: Iterable<T>, offset = 0): Iterable<[number, T]>`

Returns an iterable of enumeration pairs.

```ts
enumerate('test') //=> [[0, 't'], [1, 'e'], [2, 's'], [3, 't']]
```

### `zip<T>(...iterables: Iterable<T>[]): Iterable<T[]>`

Returns an iterator of tuples, where the `i`-th tuple contains the `i`-th element from each of the argument sequences or iterables. The iterator stops when the shortest input iterable is exhausted.

```ts
zip([1, 2, 3], ['a', 'b', 'c']) //=> [[1, 'a'], [2, 'b'], [3, 'c']]
```

### `zipLongest<T>(...iterables: Iterable<T>[]): Iterable<T[]>`

Make an iterator that aggregates elements from each of the iterables. If the iterables are of uneven length, missing values are `undefined`. Iteration continues until the longest iterable is exhausted.

```ts
zipLongest([1, 2], ['a', 'b', 'c', 'd']) //=> [[1, 'a'], [2, 'b'], [undefined, 'c'], [undefined, 'd']]
```

### `tee<T>(iterable: Iterable<T>): [Iterable<T>, Iterable<T>]`

Return two independent iterables from a single iterable.

```ts
tee([1, 2, 3]) //=> [[1, 2, 3], [1, 2, 3]]
```

### `chunk<T>(iterable: Iterable<T>, size: number): Iterable<T[]>`

Break iterable into lists of length `size`.

```ts
chunk(range(0, 10), 2) //=> [[0, 1], [2, 3], [4, 5], [6, 7], [8, 9]]
```

### `pairwise<T>(iterable: Iterable<T>): Iterable<[T, T]>`

Returns an iterator of paired items, overlapping, from the original. When the input iterable has a finite number of items `n`, the outputted iterable will have `n - 1` items.

```ts
pairwise(range(0, 5)) //=> [[0, 1], [1, 2], [2, 3], [3, 4]]
```

### `compress<T>(iterable: Iterable<T>, selectors: Iterable<boolean>): Iterable<T>`

Make an iterator that filters elements from `iterable` returning only those that have a corresponding element in selectors that evaluates to `true`.

```ts
compress([1, 2, 3, 4, 5], [true, false, true, false, true]) //=> [1, 3, 5]
```

### `sorted<T>(iterable: Iterable<T>, key: (x: T) => string | number, reverse?: boolean): T[]`

Return a sorted array from the items in iterable.

```ts
sorted(slice(range(), 0, 10), x => x)
```

### `dict<K, V>(iterable: Iterable<[K, V]>): Record<K, V>`

Return an object from an iterable, i.e. `Array.from` for objects.

```ts
dict(zip(range(0, 5), repeat(true))) //=> { 0: true, 1: true, 2: true, 3: true, 4: true }
```

## Reference

* [Itertools Recipes](https://docs.python.org/3/library/itertools.html#itertools-recipes)

## TypeScript

This project uses [TypeScript](https://github.com/Microsoft/TypeScript) and publishes definitions on NPM.

## License

Apache 2.0

[npm-image]: https://img.shields.io/npm/v/iterative.svg?style=flat
[npm-url]: https://npmjs.org/package/iterative
[downloads-image]: https://img.shields.io/npm/dm/iterative.svg?style=flat
[downloads-url]: https://npmjs.org/package/iterative
[travis-image]: https://img.shields.io/travis/blakeembrey/iterative.svg?style=flat
[travis-url]: https://travis-ci.org/blakeembrey/iterative
[coveralls-image]: https://img.shields.io/coveralls/blakeembrey/iterative.svg?style=flat
[coveralls-url]: https://coveralls.io/r/blakeembrey/iterative?branch=master
