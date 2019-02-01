import { StopIteration, SENTINEL } from "./common";

/**
 * Sync and async iterable objects.
 */
export type AnyIterable<T> = AsyncIterable<T> | Iterable<T>;

/**
 * Sync and async iterator objects.
 */
export type AnyIterator<T> = AsyncIterator<T> | Iterator<T>;

/**
 * List of values to list of iterable values.
 */
export type AnyTupleIterable<T extends any[]> = {
  [K in keyof T]: AnyIterable<T[K]>
};

/**
 * Async predicate for filtering items.
 */
export type AnyPredicate<T, U extends T = T> =
  | ((item: T) => item is U)
  | ((item: T) => boolean | Promise<boolean>);

/**
 * Async reducer function.
 */
export type AnyReducer<T, U> = (result: U, item: T) => U | Promise<U>;

/**
 *
 */
export type AnyResult<T, U> = (x: T) => U | Promise<U>;

/**
 * Returns `true` when all values in iterable are truthy.
 */
export async function all<T, U extends T>(
  iterable: AsyncIterable<T>,
  predicate: AnyPredicate<T, U> = Boolean
) {
  for await (const item of iterable) {
    if (!(await predicate(item))) return false;
  }

  return true;
}

/**
 * Returns `true` when any value in iterable is truthy.
 */
export async function any<T, U extends T>(
  iterable: AnyIterable<T>,
  predicate: AnyPredicate<T, U> = Boolean
) {
  for await (const item of iterable) {
    if (await predicate(item)) return true;
  }

  return false;
}

/**
 * Returns `true` when any value in iterable is equal to `needle`.
 */
export function contains<T>(iterable: AnyIterable<T>, needle: T) {
  return any(iterable, x => x === needle);
}

/**
 * Returns an iterable of enumeration pairs.
 */
export async function* enumerate<T>(
  iterable: AnyIterable<T>,
  offset = 0
): AsyncIterable<[number, T]> {
  let index = offset;

  for await (const value of iterable) yield [index++, value];
}

/**
 * Get next iterator value, throw when `done`.
 */
export function next<T>(iterator: AnyIterator<T>): Promise<T>;
export function next<T, U>(
  iterator: AnyIterator<T>,
  defaultValue: U
): Promise<T | U>;
export async function next<T, U>(
  iterator: AnyIterator<T>,
  defaultValue?: U
): Promise<T | U> {
  const item = await iterator.next();
  if (item.done) {
    if (arguments.length === 1) throw new StopIteration();
    return defaultValue as U;
  }
  return item.value;
}

/**
 * Returns an iterator object for the given `iterable`.
 */
export function iter<T>(iterable: AnyIterable<T>): AnyIterator<T> {
  return ((iterable as AsyncIterable<T>)[Symbol.asyncIterator] ||
    (iterable as Iterable<T>)[Symbol.iterator])();
}

/**
 * Make an iterator that returns accumulated results of binary functions.
 */
export async function* accumulate<T>(
  iterable: AnyIterable<T>,
  func: AnyReducer<T, T>
): AsyncIterable<T> {
  const it = iter(iterable);
  let item = await it.next();
  let total = item.value;

  if (item.done) return;
  yield total;

  while ((item = await it.next())) {
    if (item.done) break;
    total = await func(total, item.value);
    yield total;
  }
}

/**
 * Return an iterator flattening one level of nesting in an iterable of iterables.
 */
export async function* flatten<T>(
  iterable: AnyIterable<AnyIterable<T>>
): AsyncIterable<T> {
  for await (const it of iterable) {
    for await (const item of it) {
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
  ...iterables: Array<AnyIterable<T>>
): AsyncIterable<T> {
  return flatten(iterables);
}

/**
 * This is a versatile function to create lists containing arithmetic progressions.
 */
export async function* range(
  start = 0,
  stop = Infinity,
  step = 1
): AsyncIterable<number> {
  for (let i = start; i < stop; i += step) yield i;
}

/**
 * Make an iterator returning elements from the iterable and saving a copy of
 * each. When the iterable is exhausted, return elements from the saved copy.
 * Repeats indefinitely.
 */
export async function* cycle<T>(iterable: AnyIterable<T>): AsyncIterable<T> {
  const saved: T[] = [];

  for await (const item of iterable) {
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
export async function* repeat<T>(value: T): AsyncIterable<T> {
  while (true) yield value;
}

/**
 * Make an iterator that drops elements from the iterable as long as the
 * predicate is true; afterwards, returns every element.
 */
export async function* dropWhile<T>(
  iterable: AnyIterable<T>,
  predicate: AnyPredicate<T>
) {
  const it = iter(iterable);
  let item = await it.next();

  while (!item.done) {
    if (!(await predicate(item.value))) break;

    item = await it.next();
  }

  do {
    yield item.value;
    item = await it.next();
  } while (!item.done);
}

/**
 * Make an iterator that returns elements from the iterable as long as the
 * predicate is true.
 */
export async function* takeWhile<T>(
  iterable: AnyIterable<T>,
  predicate: AnyPredicate<T>
) {
  for await (const item of iterable) {
    if (!(await predicate(item))) break;

    yield item;
  }
}

/**
 * Make an iterator that returns consecutive keys and groups from the `iterable`.
 * The `func` is a function computing a key value for each element.
 */
export async function* groupBy<T, U>(
  iterable: AnyIterable<T>,
  func: (x: T) => U | Promise<U>
): AsyncIterable<[U, AsyncIterable<T>]> {
  const it = iter(iterable);
  let item = await it.next();

  if (item.done) return;

  let key = await func(item.value);
  let currKey: U | typeof SENTINEL = key;

  async function* grouper(): AsyncIterable<T> {
    do {
      yield item.value;

      item = await it.next();

      // Break iteration when underlying iterator is `done`.
      if (item.done) {
        currKey = SENTINEL;
        return;
      }

      currKey = await func(item.value);
    } while (key === currKey);
  }

  do {
    yield [key, grouper()];

    // Skip over any remaining values not pulled from `grouper`.
    while (key === currKey) {
      item = await it.next();
      if (item.done) return;
      currKey = await func(item.value);
    }

    key = currKey;
  } while (!item.done);
}

/**
 * Make an iterator that returns selected elements from the `iterable`.
 */
export async function* slice<T>(
  iterable: AnyIterable<T>,
  start = 0,
  stop = Infinity,
  step = 1
) {
  const it = iter(range(start, stop, step));
  let next = await it.next();

  for await (const [index, item] of enumerate(iterable)) {
    if (next.done) return;

    if (index === next.value) {
      yield item;
      next = await it.next();
    }
  }
}

/**
 * Apply function of two arguments cumulatively to the items of `iterable`, from
 * left to right, so as to reduce the iterable to a single value.
 */
export function reduce<T>(
  iterable: AnyIterable<T>,
  reducer: AnyReducer<T, T>
): T;
export function reduce<T, U>(
  iterable: AnyIterable<T>,
  reducer: AnyReducer<T, U>,
  initializer: U
): Promise<U>;
export async function reduce<T, U>(
  iterable: AnyIterable<T>,
  reducer: AnyReducer<T, T | U>,
  initializer?: U | Promise<U>
): Promise<T | U> {
  const it = iter(iterable);
  let item: IteratorResult<T>;
  let accumulator = await (initializer === undefined ? next(it) : initializer);

  while ((item = await it.next())) {
    if (item.done) break;
    accumulator = await reducer(accumulator, item.value);
  }

  return accumulator;
}

/**
 * Apply function to every item of iterable and return an iterable of the results.
 */
export async function* map<T, U>(
  iterable: AnyIterable<T>,
  func: (x: T) => U | Promise<U>
): AsyncIterable<U> {
  for await (const item of iterable) yield func(item);
}

/**
 * Make an iterator that computes the function using arguments obtained from the
 * iterable. Used instead of `map()` when argument parameters are already
 * grouped in tuples from a single iterable (the data has been "pre-zipped").
 * The difference between `map()` and `spreadmap()` parallels the distinction
 * between `function(a, b)` and `function(...c)`.
 */
export async function* spreadmap<T extends any[], U>(
  iterable: AnyIterable<T>,
  func: (...args: T) => U | Promise<U>
): AsyncIterable<U> {
  for await (const item of iterable) yield func(...item);
}

/**
 * Construct an `iterator` from those elements of `iterable` for which `func` returns true.
 */
export async function* filter<T>(
  iterable: AnyIterable<T>,
  func: AnyPredicate<T, T> = Boolean
): AsyncIterable<T> {
  for await (const item of iterable) {
    if (await func(item)) yield item;
  }
}

/**
 * Make an iterator that aggregates elements from each of the iterables. Returns
 * an iterator of tuples, where the `i`-th tuple contains the `i`-th element
 * from each of the argument sequences or iterables. The iterator stops when the
 * shortest input iterable is exhausted.
 */
export async function* zip<T extends any[]>(
  ...iterables: AnyTupleIterable<T>
): AsyncIterable<T> {
  const iters = iterables.map(x => iter(x));

  while (iters.length) {
    const result = Array(iters.length) as T;
    const items = await Promise.all(iters.map(x => x.next()));

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
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
export async function* zipLongest<T extends any[]>(
  ...iterables: AnyTupleIterable<T>
): AsyncIterable<Partial<T>> {
  const iters: Array<AnyIterator<T | undefined>> = iterables.map(x => iter(x));
  const noop = iter(repeat(undefined));
  let counter = iters.length;

  while (true) {
    const result = Array(iters.length) as Partial<T>;
    const items = await Promise.all(iters.map(x => x.next()));

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      if (item.done) {
        counter -= 1;
        iters[i] = noop;
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
export function tee<T>(
  iterable: AnyIterable<T>
): [AsyncIterable<T>, AsyncIterable<T>] {
  const queue: T[] = [];
  const it = iter(iterable);
  let owner: -1 | 0 | 1;

  async function* gen(id: 0 | 1): AsyncIterable<T> {
    while (true) {
      while (queue.length) {
        yield queue.shift()!;
      }

      if (owner === -1) return;

      let item: IteratorResult<T>;

      while ((item = await it.next())) {
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

  return [gen(0), gen(1)];
}

/**
 * Break iterable into lists of length `size`.
 */
export async function* chunk<T>(
  iterable: AnyIterable<T>,
  size: number
): AsyncIterable<T[]> {
  let chunk: T[] = [];

  for await (const item of iterable) {
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
export async function* pairwise<T>(
  iterable: AnyIterable<T>
): AsyncIterable<[T, T]> {
  const it = iter(iterable);
  let item = await it.next();
  let prev = item.value;

  if (item.done) return;

  while ((item = await it.next())) {
    if (item.done) return;
    yield [prev, item.value];
    prev = item.value;
  }
}

/**
 * Make an iterator that filters elements from `iterable` returning only those
 * that have a corresponding element in selectors that evaluates to `true`.
 */
export async function* compress<T>(
  iterable: AnyIterable<T>,
  selectors: AnyIterable<boolean>
): AsyncIterable<T> {
  for await (const [item, valid] of zip(iterable, selectors)) {
    if (valid) yield item;
  }
}

/**
 * Compare the two objects x and y and return an integer according to the
 * outcome. The return value is negative if `x < y`, positive if `x > y`,
 * otherwise zero.
 */
export function cmp<T>(x: T, y: T) {
  return x > y ? 1 : x < y ? -1 : 0;
}

/**
 * Creates an array from an iterable object.
 */
export function list<T>(iterable: AnyIterable<T>): Promise<Array<T>>;
export function list<T, U>(
  iterable: AnyIterable<T>,
  fn: (item: T) => U
): Promise<Array<U>>;
export async function list<T, U>(
  iterable: AnyIterable<T>,
  fn?: (item: T) => U
): Promise<Array<T | U>> {
  const result: Array<T | U> = [];
  for await (const item of iterable) result.push(fn ? fn(item) : item);
  return result;
}

/**
 * Return a sorted array from the items in iterable.
 */
export async function sorted<T, U = T>(
  iterable: AnyIterable<T>,
  keyFn: (x: T) => U = x => x as any,
  cmpFn: (x: U, y: U) => number = cmp,
  reverse = false
): Promise<Array<T>> {
  const array = await list<T, [U, T]>(iterable, item => [keyFn(item), item]);
  const sortFn = reverse
    ? (a: [U, T], b: [U, T]) => -cmpFn(a[0], b[0])
    : (a: [U, T], b: [U, T]) => cmpFn(a[0], b[0]);
  return array.sort(sortFn).map(x => x[1]);
}

/**
 * Return an object from an iterable, i.e. `Array.from` for objects.
 */
export async function dict<K extends string | number | symbol, V>(
  iterable: AnyIterable<[K, V]>
): Promise<Record<K, V>> {
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
export async function len(iterable: AnyIterable<any>): Promise<number> {
  let length = 0;
  for await (const _ of iterable) length++;
  return length;
}

/**
 * Return the smallest item in an iterable.
 */
export function min(iterable: AnyIterable<number>): Promise<number>;
export function min<T>(
  iterable: AnyIterable<T>,
  keyFn: (x: T) => Promise<number> | number
): Promise<number>;
export async function min<T>(
  iterable: AnyIterable<T>,
  keyFn?: (x: T) => Promise<number> | number
) {
  let value = Infinity;
  let result = undefined;

  for await (const item of iterable) {
    const tmp = keyFn ? await keyFn(item) : (item as any);
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
export function max(iterable: AnyIterable<number>): Promise<number>;
export function max<T>(
  iterable: AnyIterable<T>,
  keyFn: (x: T) => number
): Promise<number>;
export async function max<T>(
  iterable: AnyIterable<T>,
  keyFn?: (x: T) => Promise<number> | number
) {
  let value = -Infinity;
  let result = undefined;

  for await (const item of iterable) {
    const tmp = keyFn ? await keyFn(item) : (item as any);
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
export async function sum(
  iterable: Iterable<number>,
  start = 0
): Promise<number> {
  return reduce(iterable, (x, y) => x + y, start);
}