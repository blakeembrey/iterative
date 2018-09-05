/**
 * Predicate for filtering items.
 */
export type Predicate <T, U extends T = T> = ((x: T) => x is U) | ((x: T) => boolean)

/**
 * Reducer function.
 */
export type Reducer <T, U> = (x: U, y: T) => U

/**
 * Function for mapping items.
 */
export type MapFunc <T, U> = (x: T) => U

/**
 * Throw when iterator is `done`.
 */
export class StopIteration extends Error {
  constructor () {
    super('Iterator is already marked as done')
  }
}

/**
 * Unique object for comparisons.
 */
export const SENTINEL = Symbol('SENTINEL')

/**
 * Returns `true` when all values in iterable are truthy.
 */
export function all <T, U extends T> (iterable: Iterable<T>, predicate: Predicate<T, U> = Boolean) {
  for (const item of iterable) {
    if (!predicate(item)) return false
  }

  return true
}

/**
 * Returns `true` when any value in iterable are truthy.
 */
export function any <T, U extends T> (iterable: Iterable<T>, predicate: Predicate<T, U> = Boolean) {
  for (const item of iterable) {
    if (predicate(item)) return true
  }

  return false
}

/**
 * Returns `true` when any value in iterable is equal to `needle`.
 */
export function contains <T> (iterable: Iterable<T>, needle: T) {
  return any(iterable, x => x === needle)
}

/**
 * Returns an iterable of enumeration pairs.
 */
export function * enumerate <T> (iterable: Iterable<T>, offset = 0): Iterable<[number, T]> {
  let index = offset

  for (const value of iterable) yield [index++, value]
}

/**
 * Returns an iterator object for the given `iterable`.
 */
export function iter <T> (iterable: Iterable<T>): Iterator<T> {
  return iterable[Symbol.iterator]()
}

/**
 * Get next iterator value, throw when `done`.
 */
export function next <T> (iterator: Iterator<T>): T
export function next <T, U> (iterator: Iterator<T>, defaultValue: U): T | U
export function next <T, U> (iterator: Iterator<T>, defaultValue?: U): T | U {
  const item = iterator.next()
  if (item.done) {
    if (arguments.length === 1) throw new StopIteration()
    return defaultValue as U
  }
  return item.value
}

/**
 * Make an iterator that returns accumulated results of binary functions.
 */
export function * accumulate <T, U> (iterable: Iterable<T>, func: Reducer<T, T>): Iterable<T> {
  const it = iter(iterable)
  let item = it.next()
  let total = item.value

  if (item.done) return
  yield total

  while (item = it.next()) {
    if (item.done) break
    total = func(total, item.value)
    yield total
  }
}

/**
 * Return an iterator flattening one level of nesting in an iterable of iterables.
 */
export function * flatten <T> (iterable: Iterable<Iterable<T>>): Iterable<T> {
  for (const it of iterable) {
    for (const item of it) {
      yield item
    }
  }
}

/**
 * Make an iterator that returns elements from the first iterable until it is
 * exhausted, then proceeds to the next iterable, until all of the iterables are
 * exhausted. Used for treating consecutive sequences as a single sequence.
 */
export function chain <T> (...iterables: Array<Iterable<T>>): Iterable<T> {
  return flatten(iterables)
}

/**
 * This is a versatile function to create lists containing arithmetic progressions.
 */
export function * range (start = 0, stop = Infinity, step = 1): Iterable<number> {
  for (let i = start; i < stop; i += step) yield i
}

/**
 * Make an iterator returning elements from the iterable and saving a copy of
 * each. When the iterable is exhausted, return elements from the saved copy.
 * Repeats indefinitely.
 */
export function * cycle <T> (iterable: Iterable<T>): Iterable<T> {
  const saved: T[] = []

  for (const item of iterable) {
    yield item
    saved.push(item)
  }

  while (saved.length) {
    for (const item of saved) {
      yield item
    }
  }
}

/**
 * Make an iterator that repeats `value` over and over again.
 */
export function * repeat <T> (value: T): Iterable<T> {
  while (true) yield value
}

/**
 * Make an iterator that drops elements from the iterable as long as the
 * predicate is true; afterwards, returns every element.
 */
export function * dropWhile <T> (iterable: Iterable<T>, predicate: Predicate<T>) {
  const it = iter(iterable)
  let item = it.next()

  while (!item.done) {
    if (!predicate(item.value)) break

    item = it.next()
  }

  do {
    yield item.value
    item = it.next()
  } while (!item.done)
}

/**
 * Make an iterator that returns elements from the iterable as long as the
 * predicate is true.
 */
export function * takeWhile <T> (iterable: Iterable<T>, predicate: Predicate<T>) {
  for (const item of iterable) {
    if (!predicate(item)) break

    yield item
  }
}

/**
 * Make an iterator that returns consecutive keys and groups from the `iterable`.
 * The `func` is a function computing a key value for each element.
 */
export function * groupBy <T, U> (iterable: Iterable<T>, func: MapFunc<T, U>): Iterable<[U, Iterable<T>]> {
  const it = iter(iterable)
  let item = it.next()

  if (item.done) return

  let key = func(item.value)
  let currKey: U | typeof SENTINEL = key

  function * grouper (): Iterable<T> {
    do {
      yield item.value

      item = it.next()

      // Break iteration when underlying iterator is `done`.
      if (item.done) {
        currKey = SENTINEL
        return
      }

      currKey = func(item.value)
    } while (key === currKey)
  }

  do {
    yield [key, grouper()]

    // Skip over any remaining values not pulled from `grouper`.
    while (key === currKey) {
      item = it.next()
      if (item.done) return
      currKey = func(item.value)
    }

    key = currKey
  } while (!item.done)
}

/**
 * Make an iterator that returns selected elements from the `iterable`.
 */
export function * slice <T> (iterable: Iterable<T>, start = 0, stop = Infinity, step = 1) {
  const it = iter(range(start, stop, step))
  let next = it.next()

  for (const [index, item] of enumerate(iterable)) {
    if (next.done) return

    if (index === next.value) {
      yield item
      next = it.next()
    }
  }
}

/**
 * Apply function of two arguments cumulatively to the items of `iterable`, from
 * left to right, so as to reduce the iterable to a single value.
 */
export function reduce <T> (iterable: Iterable<T>, reducer: Reducer<T, T>): T
export function reduce <T, U> (iterable: Iterable<T>, reducer: Reducer<T, U>, initializer: U): U
export function reduce <T, U> (iterable: Iterable<T>, reducer: Reducer<T, T | U>, initializer?: U): T | U {
  const it = iter(iterable)
  let item: IteratorResult<T>
  let accumulator: T | U = initializer === undefined ? next(it) : initializer

  while (item = it.next()) {
    if (item.done) break
    accumulator = reducer(accumulator, item.value)
  }

  return accumulator
}

/**
 * Apply function to every item of iterable and return an iterable of the results.
 */
export function * map <T, U> (iterable: Iterable<T>, func: MapFunc<T, U>): Iterable<U> {
  for (const item of iterable) yield func(item)
}

/**
 * Construct an `iterator` from those elements of `iterable` for which `func` returns true.
 */
export function * filter <T, U extends T> (iterable: Iterable<T>, func: Predicate<T, U> = Boolean): Iterable<U> {
  for (const item of iterable) {
    if (func(item)) yield item
  }
}

/**
 * This function returns a list of tuples, where the `i`-th tuple contains the
 * `i`-th element from each of the argument `iterables`.
 */
export function zip <T1> (iter1: Iterable<T1>): Iterable<[T1]>
export function zip <T1, T2> (iter1: Iterable<T1>, iter2: Iterable<T2>): Iterable<[T1, T2]>
export function zip <T1, T2, T3> (iter1: Iterable<T1>, iter2: Iterable<T2>, iter3: Iterable<T3>): Iterable<[T1, T2, T3]>
export function zip <T1, T2, T3, T4> (iter1: Iterable<T1>, iter2: Iterable<T2>, iter3: Iterable<T3>, iter4: Iterable<T4>): Iterable<[T1, T2, T3, T4]>
export function zip <T1, T2, T3, T4, T5> (iter1: Iterable<T1>, iter2: Iterable<T2>, iter3: Iterable<T3>, iter4: Iterable<T4>, iter5: Iterable<T5>): Iterable<[T1, T2, T3, T4, T5]>
export function * zip <T> (...iterables: Array<Iterable<T>>): Iterable<T[]> {
  const iters = iterables.map(x => iter(x))

  while (true) {
    const result: T[] = []

    for (const iter of iters) {
      const item = iter.next()
      if (item.done) return
      result.push(item.value)
    }

    yield result
  }
}

/**
 * Return two independent iterables from a single iterable.
 */
export function tee <T> (iterable: Iterable<T>): [Iterable<T>, Iterable<T>] {
  const queue: T[] = []
  const it = iter(iterable)
  let owner: -1 | 0 | 1

  function * gen (id: 0 | 1): Iterable<T> {
    while (true) {
      while (queue.length) {
        yield queue.shift()!
      }

      if (owner === -1) return

      let item: IteratorResult<T>

      while (item = it.next()) {
        if (item.done) {
          owner = -1
          return
        }

        owner = id
        queue.push(item.value)
        yield item.value
        if (id !== owner) break
      }
    }
  }

  return [gen(0), gen(1)]
}

/**
 * Break iterable into lists of length `size`.
 */
export function * chunk <T> (iterable: Iterable<T>, size: number): Iterable<T[]> {
  let chunk: T[] = []

  for (const item of iterable) {
    chunk.push(item)

    if (chunk.length === size) {
      yield chunk
      chunk = []
    }
  }

  if (chunk.length) yield chunk
}

/**
 * Returns an iterator of paired items, overlapping, from the original. When
 * the input iterable has a finite number of items `n`, the outputted iterable
 * will have `n - 1` items.
 */
export function * pairwise <T> (iterable: Iterable<T>): Iterable<[T, T]> {
  const it = iter(iterable)
  let item = it.next()
  let prev = item.value

  if (item.done) return

  while (item = it.next()) {
    if (item.done) return
    yield [prev, item.value]
    prev = item.value
  }
}

/**
 * Make an iterator that filters elements from `iterable` returning only those
 * that have a corresponding element in selectors that evaluates to `true`.
 */
export function * compress <T> (iterable: Iterable<T>, selectors: Iterable<boolean>): Iterable<T> {
  for (const [item, valid] of zip(iterable, selectors)) {
    if (valid) yield item
  }
}

/**
 * Return a new sorted list from the items in iterable.
 */
export function sorted <T> (iterable: Iterable<T>, key: MapFunc <T, string | number>, reverse = false): Array<T> {
  const dir = reverse ? -1 : 1
  const array = Array.from<T, [number | string, T]>(iterable, item => [key(item), item])
  return array.sort((a, b) => a[0] > b[0] ? dir : (a[0] < b[0] ? -dir : 0)).map(x => x[1])
}

/**
 * Return an object from an iterable, i.e. `Array.from` for objects.
 */
export function dict <K extends string | number | symbol, V> (iterable: Iterable<[K, V]>): Record<K, V> {
  return reduce(iterable, (obj, [key, value]) => {
    obj[key] = value
    return obj
  }, Object.create(null))
}
