import { StopIteration, SENTINEL, identity, cmp } from "./common";

/**
 * Predicate for filtering items.
 */
export type Predicate<T, U extends T = T> =
  | ((item: T) => item is U)
  | ((item: T) => boolean);

/**
 * Reducer function.
 */
export type Reducer<T, U> = (result: U, item: T) => U;

/**
 * List of values to list of iterable values.
 */
export type TupleIterable<T extends any[]> = { [K in keyof T]: Iterable<T[K]> };

/**
 * Unary function mapping an input value to an output value.
 */
export type Func<T, U> = (item: T) => U;

/**
 * Returns `true` when all values in iterable are truthy.
 */
export function all<T, U extends T>(
  iterable: Iterable<T>,
  predicate: Predicate<T, U> = Boolean
) {
  for (const item of iterable) {
    if (!predicate(item)) return false;
  }

  return true;
}

/**
 * Returns `true` when any value in iterable is truthy.
 */
export function any<T, U extends T>(
  iterable: Iterable<T>,
  predicate: Predicate<T, U> = Boolean
) {
  for (const item of iterable) {
    if (predicate(item)) return true;
  }

  return false;
}

/**
 * Returns `true` when any value in iterable is equal to `needle`.
 */
export function contains<T>(iterable: Iterable<T>, needle: T) {
  return any(iterable, x => x === needle);
}

/**
 * Returns an iterable of enumeration pairs.
 */
export function enumerate<T>(iterable: Iterable<T>, offset = 0) {
  return zip(range(offset), iterable);
}

/**
 * Get next iterator value, throw when `done`.
 */
export function next<T>(iterator: Iterator<T>): T;
export function next<T, U>(iterator: Iterator<T>, defaultValue: U): T | U;
export function next<T, U>(iterator: Iterator<T>, defaultValue?: U): T | U {
  const item = iterator.next();
  if (item.done) {
    if (arguments.length === 1) throw new StopIteration();
    return defaultValue as U;
  }
  return item.value;
}

/**
 * Returns an iterator object for the given `iterable`.
 */
export function iter<T>(iterable: Iterable<T>): Iterator<T> {
  return iterable[Symbol.iterator]();
}

/**
 * Convert an iterator object back into an iterator.
 */
export function* iterable<T>(iterator: Iterator<T>): Iterable<T> {
  while (true) {
    const item = iterator.next();
    if (item.done) return;
    yield item.value;
  }
}

/**
 * Make an iterator that returns accumulated results of binary functions.
 */
export function* accumulate<T>(
  iterable: Iterable<T>,
  func: Reducer<T, T>
): IterableIterator<T> {
  const it = iter(iterable);
  let item = it.next();
  let total = item.value;

  if (item.done) return;
  yield total;

  while ((item = it.next())) {
    if (item.done) break;
    total = func(total, item.value);
    yield total;
  }
}

/**
 * Return an iterator flattening one level of nesting in an iterable of iterables.
 */
export function* flatten<T>(
  iterable: Iterable<Iterable<T>>
): IterableIterator<T> {
  for (const it of iterable) {
    for (const item of it) {
      yield item;
    }
  }
}

/**
 * Make an iterator that returns elements from the first iterable until it is
 * exhausted, then proceeds to the next iterable, until all of the iterables are
 * exhausted. Used for treating consecutive sequences as a single sequence.
 */
export function chain<T>(
  ...iterables: Array<Iterable<T>>
): IterableIterator<T> {
  return flatten(iterables);
}

/**
 * This is a versatile function to create lists containing arithmetic progressions.
 */
export function* range(
  start = 0,
  stop = Infinity,
  step = 1
): IterableIterator<number> {
  for (let i = start; i < stop; i += step) yield i;
}

/**
 * Make an iterator returning elements from the iterable and saving a copy of
 * each. When the iterable is exhausted, return elements from the saved copy.
 * Repeats indefinitely.
 */
export function* cycle<T>(iterable: Iterable<T>): IterableIterator<T> {
  const saved: T[] = [];

  for (const item of iterable) {
    yield item;
    saved.push(item);
  }

  while (saved.length) {
    for (const item of saved) {
      yield item;
    }
  }
}

/**
 * Make an iterator that repeats `value` over and over again.
 */
export function* repeat<T>(value: T, times?: number): IterableIterator<T> {
  if (times === undefined) while (true) yield value;
  for (let i = 0; i < times; i++) yield value;
}

/**
 * Make an iterator that drops elements from the iterable as long as the
 * predicate is true; afterwards, returns every element.
 */
export function* dropWhile<T>(iterable: Iterable<T>, predicate: Predicate<T>) {
  const it = iter(iterable);
  let item = it.next();

  while (!item.done) {
    if (!predicate(item.value)) break;

    item = it.next();
  }

  do {
    yield item.value;
    item = it.next();
  } while (!item.done);
}

/**
 * Make an iterator that returns elements from the iterable as long as the
 * predicate is true.
 */
export function* takeWhile<T>(iterable: Iterable<T>, predicate: Predicate<T>) {
  for (const item of iterable) {
    if (!predicate(item)) break;

    yield item;
  }
}

/**
 * Make an iterator that returns consecutive keys and groups from the `iterable`.
 * The `func` is a function computing a key value for each element.
 */
export function* groupBy<T, U>(iterable: Iterable<T>, func: Func<T, U>) {
  const it = iter(iterable);
  let item = it.next();

  if (item.done) return;

  let key = func(item.value);
  let currKey: U | typeof SENTINEL = key;

  function* grouper() {
    do {
      yield item.value;

      item = it.next();

      // Break iteration when underlying iterator is `done`.
      if (item.done) {
        currKey = SENTINEL;
        return;
      }

      currKey = func(item.value);
    } while (key === currKey);
  }

  do {
    yield [key, grouper()] as [U, IterableIterator<T>];

    // Skip over any remaining values not pulled from `grouper`.
    while (key === currKey) {
      item = it.next();
      if (item.done) return;
      currKey = func(item.value);
    }

    key = currKey;
  } while (!item.done);
}

/**
 * Make an iterator that returns selected elements from the `iterable`.
 */
export function* slice<T>(
  iterable: Iterable<T>,
  start = 0,
  stop = Infinity,
  step = 1
) {
  const it = iter(range(start, stop, step));
  let next = it.next();

  for (const [index, item] of enumerate(iterable)) {
    if (next.done) return;

    if (index === next.value) {
      yield item;
      next = it.next();
    }
  }
}

/**
 * Apply function of two arguments cumulatively to the items of `iterable`, from
 * left to right, so as to reduce the iterable to a single value.
 */
export function reduce<T>(iterable: Iterable<T>, reducer: Reducer<T, T>): T;
export function reduce<T, U>(
  iterable: Iterable<T>,
  reducer: Reducer<T, U>,
  initializer: U
): U;
export function reduce<T, U>(
  iterable: Iterable<T>,
  reducer: Reducer<T, T | U>,
  initializer?: U
): T | U {
  const it = iter(iterable);
  let item: IteratorResult<T>;
  let accumulator: T | U = initializer === undefined ? next(it) : initializer;

  while ((item = it.next())) {
    if (item.done) break;
    accumulator = reducer(accumulator, item.value);
  }

  return accumulator;
}

/**
 * Apply function to every item of iterable and return an iterable of the results.
 */
export function* map<T, U>(
  iterable: Iterable<T>,
  func: Func<T, U>
): IterableIterator<U> {
  for (const item of iterable) yield func(item);
}

/**
 * Make an iterator that computes the function using arguments obtained from the
 * iterable. Used instead of `map()` when argument parameters are already
 * grouped in tuples from a single iterable (the data has been "pre-zipped").
 * The difference between `map()` and `spreadmap()` parallels the distinction
 * between `function(a, b)` and `function(...c)`.
 */
export function* spreadmap<T extends any[], U>(
  iterable: Iterable<T>,
  func: (...args: T) => U
): IterableIterator<U> {
  for (const item of iterable) yield func(...item);
}

/**
 * Construct an `iterator` from those elements of `iterable` for which `func` returns true.
 */
export function* filter<T, U extends T>(
  iterable: Iterable<T>,
  func: Predicate<T, U> = Boolean
): IterableIterator<U> {
  for (const item of iterable) {
    if (func(item)) yield item;
  }
}

/**
 * Make an iterator that aggregates elements from each of the iterables. Returns
 * an iterator of tuples, where the `i`-th tuple contains the `i`-th element
 * from each of the argument sequences or iterables. The iterator stops when the
 * shortest input iterable is exhausted.
 */
export function* zip<T extends any[]>(
  ...iterables: TupleIterable<T>
): IterableIterator<T> {
  const iters = iterables.map(x => iter(x));

  while (iters.length) {
    const result = Array(iters.length) as T;

    for (let i = 0; i < iters.length; i++) {
      const item = iters[i].next();
      if (item.done) return;
      result[i] = item.value;
    }

    yield result;
  }
}

/**
 * Make an iterator that aggregates elements from each of the iterables. If the
 * iterables are of uneven length, missing values are `undefined`. Iteration
 * continues until the longest iterable is exhausted.
 */
export function zipLongest<T extends any[]>(...iterables: TupleIterable<T>) {
  return zipWithValue<T, undefined>(undefined, ...(iterables as any));
}

/**
 * Make an iterator that aggregates elements from each of the iterables. If the
 * iterables are of uneven length, missing values are `fillValue`. Iteration
 * continues until the longest iterable is exhausted.
 */
export function* zipWithValue<T extends any[], U>(
  fillValue: U,
  ...iterables: TupleIterable<T>
): IterableIterator<{ [K in keyof T]: T[K] | U }> {
  const iters = iterables.map<Iterator<T | U>>(x => iter(x));
  const noop = iter(repeat(fillValue));
  let counter = iters.length;

  while (true) {
    const result = Array(iters.length) as { [K in keyof T]: T[K] | U };

    for (let i = 0; i < iters.length; i++) {
      const item = iters[i].next();

      if (item.done) {
        counter -= 1;
        iters[i] = noop;
        result[i] = fillValue;
      } else {
        result[i] = item.value;
      }
    }

    if (counter === 0) break;

    yield result;
  }
}

/**
 * Return two independent iterables from a single iterable.
 */
export function tee<T>(iterable: Iterable<T>) {
  const queue: T[] = [];
  const it = iter(iterable);
  let owner: -1 | 0 | 1;

  function* gen(id: 0 | 1): IterableIterator<T> {
    while (true) {
      while (queue.length) {
        yield queue.shift()!;
      }

      if (owner === -1) return;

      let item: IteratorResult<T>;

      while ((item = it.next())) {
        if (item.done) {
          owner = -1;
          return;
        }

        owner = id;
        queue.push(item.value);
        yield item.value;
        if (id !== owner) break;
      }
    }
  }

  return [gen(0), gen(1)] as [IterableIterator<T>, IterableIterator<T>];
}

/**
 * Break iterable into lists of length `size`.
 */
export function* chunk<T>(
  iterable: Iterable<T>,
  size: number
): IterableIterator<T[]> {
  let chunk: T[] = [];

  for (const item of iterable) {
    chunk.push(item);

    if (chunk.length === size) {
      yield chunk;
      chunk = [];
    }
  }

  if (chunk.length) yield chunk;
}

/**
 * Returns an iterator of paired items, overlapping, from the original. When
 * the input iterable has a finite number of items `n`, the outputted iterable
 * will have `n - 1` items.
 */
export function* pairwise<T>(iterable: Iterable<T>): IterableIterator<[T, T]> {
  const it = iter(iterable);
  let item = it.next();
  let prev = item.value;

  if (item.done) return;

  while ((item = it.next())) {
    if (item.done) return;
    yield [prev, item.value];
    prev = item.value;
  }
}

/**
 * Make an iterator that filters elements from `iterable` returning only those
 * that have a corresponding element in selectors that evaluates to `true`.
 */
export function* compress<T>(
  iterable: Iterable<T>,
  selectors: Iterable<boolean>
): IterableIterator<T> {
  for (const [item, valid] of zip(iterable, selectors)) {
    if (valid) yield item;
  }
}

/**
 * Creates an array from an iterable object.
 */
export function list<T, U = T>(
  iterable: Iterable<T>,
  fn?: Func<T, U>
): Array<U>;
export function list<T, U>(
  iterable: Iterable<T>,
  fn: Func<T, T | U> = identity
): Array<T | U> {
  const result: Array<T | U> = [];
  for (const item of iterable) result.push(fn(item));
  return result;
}

/**
 * Return a sorted array from the items in iterable.
 */
export function sorted<T, U = T>(
  iterable: Iterable<T>,
  keyFn?: Func<T, U>,
  cmpFn?: (x: U, y: U) => number,
  reverse?: boolean
): Array<T>;
export function sorted<T, U>(
  iterable: Iterable<T>,
  keyFn: Func<T, U | T> = identity,
  cmpFn: (x: U | T, y: U | T) => number = cmp,
  reverse = false
): Array<T> {
  const array = list<T, [U | T, T]>(iterable, item => [keyFn(item), item]);
  const sortFn = reverse
    ? (a: [U | T, T], b: [U | T, T]) => -cmpFn(a[0], b[0])
    : (a: [U | T, T], b: [U | T, T]) => cmpFn(a[0], b[0]);
  return array.sort(sortFn).map(x => x[1]);
}

/**
 * Return an object from an iterable, i.e. `Array.from` for objects.
 */
export function dict<K extends string | number | symbol, V>(
  iterable: Iterable<[K, V]>
): Record<K, V> {
  return reduce(
    iterable,
    (obj, [key, value]) => {
      obj[key] = value;
      return obj;
    },
    Object.create(null)
  );
}

/**
 * Return the length (the number of items) of an iterable.
 */
export function len(iterable: Iterable<any>): number {
  let length = 0;
  for (const _ of iterable) length++;
  return length;
}

/**
 * Return the smallest item in an iterable.
 */
export function min(iterable: Iterable<number>): number;
export function min<T>(iterable: Iterable<T>, keyFn: (x: T) => number): number;
export function min<T extends number>(
  iterable: Iterable<T>,
  keyFn: Func<T, T> = identity
) {
  let value = Infinity;
  let result = undefined;

  for (const item of iterable) {
    const tmp = keyFn(item);
    if (tmp < value) {
      value = tmp;
      result = item;
    }
  }

  return result;
}

/**
 * Return the largest item in an iterable.
 */
export function max(iterable: Iterable<number>): number;
export function max<T>(iterable: Iterable<T>, keyFn: (x: T) => number): number;
export function max<T extends number>(
  iterable: Iterable<T>,
  keyFn: Func<T, T> = identity
) {
  let value = -Infinity;
  let result = undefined;

  for (const item of iterable) {
    const tmp = keyFn(item);
    if (tmp > value) {
      value = tmp;
      result = item;
    }
  }

  return result;
}

/**
 * Sums `start` and the items of an `iterable` from left to right and returns
 * the total.
 */
export function sum(iterable: Iterable<number>, start = 0): number {
  return reduce(iterable, (x, y) => x + y, start);
}

/**
 * Recursively produce all produces of a list of iterators.
 */
function* _product<T>(
  pools: Iterator<T | typeof SENTINEL>[],
  buffer: T[] = []
): IterableIterator<T[]> {
  if (pools.length === 0) {
    yield buffer.slice();
    return;
  }

  const [pool, ...others] = pools;

  while (true) {
    const item = pool.next();
    if (item.value === SENTINEL) break;
    buffer.push(item.value);
    yield* _product(others, buffer);
    buffer.pop();
  }
}

/**
 * Cartesian product of input iterables.
 */
export function* product<T extends any[]>(
  ...iterables: TupleIterable<T>
): IterableIterator<T> {
  const pools = iterables.map(x => iter(cycle(chain(x, repeat(SENTINEL, 1)))));

  yield* _product(pools) as IterableIterator<T>;
}
