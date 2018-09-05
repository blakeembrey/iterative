import * as iter from './index'

describe('iterative', () => {
  describe('all', () => {
    it('should return true when all match', () => {
      const result = iter.all([1, 2, 3], x => true)

      expect(result).toBe(true)
    })

    it('should return false when a value does not match', () => {
      const result = iter.all([1, 2, 3], x => x % 2 === 1)

      expect(result).toBe(false)
    })
  })

  describe('any', () => {
    it('should return true when any match', () => {
      const result = iter.any([1, 2, 3], x => x === 3)

      expect(result).toBe(true)
    })

    it('should return false when none match', () => {
      const result = iter.any([1, 2, 3], x => x === 5)

      expect(result).toBe(false)
    })
  })

  describe('contains', () => {
    it('should find value in iterator', () => {
      const result = iter.contains('test', 's')

      expect(result).toBe(true)
    })

    it('should return false when not found', () => {
      const result = iter.contains('test', 'a')

      expect(result).toBe(false)
    })
  })

  describe('accumulate', () => {
    it('should accumulate values from iterator', () => {
      const iterable = iter.accumulate([1, 2, 3], (x, y) => x + y)

      expect(Array.from(iterable)).toEqual([1, 3, 6])
    })
  })

  describe('range', () => {
    it('should generate range from 0 until stop', () => {
      const iterable = iter.range(0, 5)

      expect(Array.from(iterable)).toEqual([0, 1, 2, 3, 4])
    })

    it('should generate range from start to stop', () => {
      const iterable = iter.range(5, 10)

      expect(Array.from(iterable)).toEqual([5, 6, 7, 8, 9])
    })

    it('should generate range from start to stop with step', () => {
      const iterable = iter.range(0, 30, 5)

      expect(Array.from(iterable)).toEqual([0, 5, 10, 15, 20, 25])
    })
  })

  describe('flatten', () => {
    it('should flatten an iterable of iterables', () => {
      const iterable = iter.slice(
        iter.flatten(iter.map(iter.range(), stop => iter.range(0, stop))),
        10,
        20
      )

      expect(Array.from(iterable)).toEqual([0, 1, 2, 3, 4, 0, 1, 2, 3, 4])
    })
  })

  describe('chain', () => {
    it('should chain together iterables', () => {
      const iterable = iter.chain(iter.range(0, 5), iter.range(0, 5))

      expect(Array.from(iterable)).toEqual([0, 1, 2, 3, 4, 0, 1, 2, 3, 4])
    })

    it('should allow flat map', () => {
      const iterable = iter.chain(
        ...iter.map(iter.range(0, 5), stop => iter.range(0, stop))
      )

      expect(Array.from(iterable)).toEqual([0, 0, 1, 0, 1, 2, 0, 1, 2, 3])
    })
  })

  describe('slice', () => {
    it('should slice an iterable', () => {
      const iterable = iter.slice(iter.range(0, 1000), 0, 10)

      expect(Array.from(iterable)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
    })

    it('should slice from non-zero offset', () => {
      const iterable = iter.slice(iter.range(), 2, 4)

      expect(Array.from(iterable)).toEqual([2, 3])
    })
  })

  describe('dropWhile', () => {
    it('should drop values until predicate becomes falsy', () => {
      const iterable = iter.slice(iter.dropWhile(iter.range(), x => x < 10), 0, 3)

      expect(Array.from(iterable)).toEqual([10, 11, 12])
    })

    it('should drop nothing if immediately returns false', () => {
      const iterable = iter.slice(iter.dropWhile(iter.range(), x => false), 0, 3)

      expect(Array.from(iterable)).toEqual([0, 1, 2])
    })
  })

  describe('takeWhile', () => {
    it('take while predicate is truthy', () => {
      const iterable = iter.takeWhile(iter.range(), x => x < 5)

      expect(Array.from(iterable)).toEqual([0, 1, 2, 3, 4])
    })
  })

  describe('repeat', () => {
    it('should repeat a value indefinitely', () => {
      const iterable = iter.slice(iter.repeat(10), 0, 5)

      expect(Array.from(iterable)).toEqual([10, 10, 10, 10, 10])
    })
  })

  describe('cycle', () => {
    it('should cycle over an iterator producing an infinite iterator', () => {
      const iterable = iter.slice(iter.cycle('abc'), 0, 5)

      expect(Array.from(iterable)).toEqual(['a', 'b', 'c', 'a', 'b'])
    })
  })

  describe('groupBy', () => {
    it('should group by sequentially', () => {
      const iterable = iter.groupBy([1, 2, 3, 4, 5], x => Math.floor(x / 2))
      const result = Array.from(iterable, ([index, iterable]) => [index, Array.from(iterable)])

      expect(result).toEqual([[0, [1]], [1, [2, 3]], [2, [4, 5]]])
    })

    it('should skip over groups when not consumed', () => {
      const iterable = iter.groupBy([1, 2, 3, 4, 5], x => Math.floor(x / 2))
      const result = Array.from(iterable, ([index]) => index)

      expect(result).toEqual([0, 1, 2])
    })

    it('should consume partial groups', () => {
      const iterable = iter.groupBy([1, 2, 3, 4, 5], x => Math.floor(x / 2))
      const result = Array.from(iterable, ([index, iterable]) => {
        return [index, iter.iter(iterable).next().value]
      })

      expect(result).toEqual([[0, 1], [1, 2], [2, 4]])
    })
  })

  describe('slice', () => {
    it('should slice an iterable', () => {
      const iterable = iter.slice([1, 2, 3, 4, 5], 0, 2)

      expect(Array.from(iterable)).toEqual([1, 2])
    })

    it('should exhaust an interable when range is too large', () => {
      const iterable = iter.slice([1, 2, 3, 4, 5], 2, 10)

      expect(Array.from(iterable)).toEqual([3, 4, 5])
    })

    it('should specify a custom step', () => {
      const iterable = iter.slice([1, 2, 3, 4, 5], 0, Infinity, 3)

      expect(Array.from(iterable)).toEqual([1, 4])
    })
  })

  describe('reduce', () => {
    it('should reduce an iterator to a single value', () => {
      const result = iter.reduce(iter.range(0, 5), (x, y) => x + y)

      expect(result).toEqual(10)
    })
  })

  describe('map', () => {
    it('should map iterator values', () => {
      const iterable = iter.slice(iter.map(iter.range(), x => x * x), 0, 5)

      expect(Array.from(iterable)).toEqual([0, 1, 4, 9, 16])
    })
  })

  describe('spreadmap', () => {
    it('should spread map iterator values', () => {
      const iterable = iter.slice(iter.spreadmap(iter.zip(iter.range(), iter.range()), (a, b) => a + b), 0, 5)

      expect(Array.from(iterable)).toEqual([0, 2, 4, 6, 8])
    })
  })

  describe('filter', () => {
    it('should filter values from iterator', () => {
      const iterable = iter.slice(iter.filter(iter.range(), x => x % 2 === 0), 0, 5)

      expect(Array.from(iterable)).toEqual([0, 2, 4, 6, 8])
    })

    it('should filter with correct output type', () => {
      const iterable = iter.filter(['a', 1, 'b', 2, 'c', 3], (x): x is string => typeof x === 'string')

      expect(Array.from(iterable)).toEqual(['a', 'b', 'c'])
    })
  })

  describe('tee', () => {
    it('should return two independent iterables from one', () => {
      const iterable = iter.map([1, 2, 3], x => x * 2)
      const [a, b] = iter.tee(iterable)

      expect(Array.from(a)).toEqual([2, 4, 6])
      expect(Array.from(b)).toEqual([2, 4, 6])
    })

    it('should read varying from cache to iterable', () => {
      const iterable = iter.range(0, 5)
      const [a, b] = iter.tee(iterable).map(iter.iter)

      expect([a.next().value, a.next().value]).toEqual([0, 1])
      expect([b.next().value, b.next().value, b.next().value]).toEqual([0, 1, 2])

      expect([a.next().value, a.next().value]).toEqual([2, 3])
      expect([b.next().value, b.next().value]).toEqual([3, 4])

      expect(a.next().value).toEqual(4)
      expect(b.next().value).toEqual(undefined)
    })

    it('should tee empty iterable', () => {
      const iterable = iter.range(0, 0)
      const [a, b] = iter.tee(iterable)

      expect(Array.from(a)).toEqual([])
      expect(Array.from(b)).toEqual([])
    })

    it('should call `next` the right number of times', () => {
      let i = 0
      const next = jest.fn(() => ({ value: i++, done: i > 10 }))
      const iterable: Iterable<number> = { [Symbol.iterator]: () => ({ next }) }

      const [a, b] = iter.tee(iterable)

      // Exhaust both iterables.
      expect(Array.from(a)).toEqual(Array.from(iter.range(0, 10)))
      expect(Array.from(b)).toEqual(Array.from(iter.range(0, 10)))

      expect(next.mock.calls.length).toEqual(11)
    })
  })

  describe('chunk', () => {
    it('should chunk an iterable', () => {
      const iterable = iter.chunk([1, 2, 3, 4, 5, 6], 2)

      expect(Array.from(iterable)).toEqual([[1, 2], [3, 4], [5, 6]])
    })

    it('should yield last chunk when less than chunk size', () => {
      const iterable = iter.chunk([1, 2, 3, 4, 5], 3)

      expect(Array.from(iterable)).toEqual([[1, 2, 3], [4, 5]])
    })
  })

  describe('pairwise', () => {
    it('should generate pairwise iterator', () => {
      const iterable = iter.pairwise([1, 2, 3, 4])

      expect(Array.from(iterable)).toEqual([[1, 2], [2, 3], [3, 4]])
    })

    it('should not generate any values when iterator too small', () => {
      const iterable = iter.pairwise([1])

      expect(Array.from(iterable)).toEqual([])
    })
  })

  describe('zip', () => {
    it('should zip two iterables', () => {
      const iterable = iter.zip([1, 2, 3], ['a', 'b', 'c'])

      expect(Array.from(iterable)).toEqual([[1, 'a'], [2, 'b'], [3, 'c']])
    })

    it('should stop when an iterable is done', () => {
      const iterable = iter.zip([1, 2, 3], [1, 2, 3, 4, 5])

      expect(Array.from(iterable)).toEqual([[1, 1], [2, 2], [3, 3]])
    })

    it('should do nothing without iterables', () => {
      const iterable = iter.zip()

      expect(Array.from(iterable)).toEqual([])
    })
  })

  describe('compress', () => {
    it('should compress an iterable based on boolean sequence', () => {
      const iterable = iter.compress(iter.range(), [true, false, true])

      expect(Array.from(iterable)).toEqual([0, 2])
    })
  })

  describe('sorted', () => {
    it('should return a sorted list', () => {
      const list = iter.sorted(iter.slice(iter.cycle([1, 2, 3]), 0, 10), x => x)

      expect(list).toEqual([1, 1, 1, 1, 2, 2, 2, 3, 3, 3])
    })

    it('should return list in reverse order', () => {
      const list = iter.sorted(iter.slice(iter.range(), 0, 10), x => x, true)

      expect(list).toEqual([9, 8, 7, 6, 5, 4, 3, 2, 1, 0])
    })
  })

  describe('dict', () => {
    it('should create an object from an iterable', () => {
      const iterable = iter.zip(iter.range(1, 4), iter.repeat(true))

      expect(iter.dict(iterable)).toEqual({ 1: true, 2: true, 3: true })
    })
  })
})
