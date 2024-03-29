import * as iter from "./async";
import { expectType, TypeEqual } from "ts-expect";

describe("iterative", () => {
  describe("all", () => {
    it("should return true when all match", async () => {
      const result = await iter.all([1, 2, 3], (x) => true);

      expect(result).toBe(true);
    });

    it("should return false when a value does not match", async () => {
      const result = await iter.all([1, 2, 3], (x) => x % 2 === 1);

      expect(result).toBe(false);
    });
  });

  describe("any", () => {
    it("should return true when any match", async () => {
      const result = await iter.any([1, 2, 3], (x) => x === 3);

      expect(result).toBe(true);
    });

    it("should return false when none match", async () => {
      const result = await iter.any([1, 2, 3], (x) => x === 5);

      expect(result).toBe(false);
    });
  });

  describe("contains", () => {
    it("should find value in iterator", async () => {
      const result = await iter.contains("test", "s");

      expect(result).toBe(true);
    });

    it("should return false when not found", async () => {
      const result = await iter.contains("test", "a");

      expect(result).toBe(false);
    });
  });

  describe("accumulate", () => {
    it("should accumulate values from iterator", async () => {
      const iterable = iter.accumulate([1, 2, 3], (x, y) => x + y);

      expect(await iter.list(iterable)).toEqual([1, 3, 6]);
    });
  });

  describe("range", () => {
    it("should generate range from 0 until stop", async () => {
      const iterable = iter.range(0, 5);

      expect(await iter.list(iterable)).toEqual([0, 1, 2, 3, 4]);
    });

    it("should generate range from start to stop", async () => {
      const iterable = iter.range(5, 10);

      expect(await iter.list(iterable)).toEqual([5, 6, 7, 8, 9]);
    });

    it("should generate range from start to stop with step", async () => {
      const iterable = iter.range(0, 30, 5);

      expect(await iter.list(iterable)).toEqual([0, 5, 10, 15, 20, 25]);
    });
  });

  describe("flatten", () => {
    it("should flatten an iterable of iterables", async () => {
      const iterable = iter.slice(
        iter.flatten(iter.map(iter.range(), (stop) => iter.range(0, stop))),
        10,
        20
      );

      expect(await iter.list(iterable)).toEqual([0, 1, 2, 3, 4, 0, 1, 2, 3, 4]);
    });
  });

  describe("chain", () => {
    it("should chain together iterables", async () => {
      const iterable = iter.chain(iter.range(0, 5), iter.range(0, 5));

      expect(await iter.list(iterable)).toEqual([0, 1, 2, 3, 4, 0, 1, 2, 3, 4]);
    });

    it("should allow flat map", async () => {
      const iterable = iter.chain(
        ...(await iter.list(
          iter.map(iter.range(0, 5), (stop) => iter.range(0, stop))
        ))
      );

      expect(await iter.list(iterable)).toEqual([0, 0, 1, 0, 1, 2, 0, 1, 2, 3]);
    });
  });

  describe("slice", () => {
    it("should slice an iterable", async () => {
      const iterable = iter.slice(iter.range(0, 1000), 0, 10);

      expect(await iter.list(iterable)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });

    it("should slice from non-zero offset", async () => {
      const iterable = iter.slice(iter.range(), 2, 4);

      expect(await iter.list(iterable)).toEqual([2, 3]);
    });
  });

  describe("dropWhile", () => {
    it("should drop values until predicate becomes falsy", async () => {
      const iterable = iter.slice(
        iter.dropWhile(iter.range(), (x) => x < 10),
        0,
        3
      );

      expect(await iter.list(iterable)).toEqual([10, 11, 12]);
    });

    it("should drop nothing if immediately returns false", async () => {
      const iterable = iter.slice(
        iter.dropWhile(iter.range(), (x) => false),
        0,
        3
      );

      expect(await iter.list(iterable)).toEqual([0, 1, 2]);
    });
  });

  describe("takeWhile", () => {
    it("take while predicate is truthy", async () => {
      const iterable = iter.takeWhile(iter.range(), (x) => x < 5);

      expect(await iter.list(iterable)).toEqual([0, 1, 2, 3, 4]);
    });
  });

  describe("repeat", () => {
    it("should repeat a value indefinitely", async () => {
      const iterable = iter.slice(iter.repeat(10), 0, 5);

      expect(await iter.list(iterable)).toEqual([10, 10, 10, 10, 10]);
    });

    it("should repeat a value up to times", async () => {
      const iterable = iter.repeat(10, 5);

      expect(await iter.list(iterable)).toEqual([10, 10, 10, 10, 10]);
    });
  });

  describe("cycle", () => {
    it("should cycle over an iterator producing an infinite iterator", async () => {
      const iterable = iter.slice(iter.cycle("abc"), 0, 5);

      expect(await iter.list(iterable)).toEqual(["a", "b", "c", "a", "b"]);
    });
  });

  describe("groupBy", () => {
    it("should group by sequentially", async () => {
      const iterable = iter.groupBy([1, 2, 3, 4, 5], (x) => Math.floor(x / 2));
      const result = await iter.list(iterable, async ([index, iterable]) => [
        index,
        await iter.list(iterable),
      ]);

      expect(result).toEqual([
        [0, [1]],
        [1, [2, 3]],
        [2, [4, 5]],
      ]);
    });

    it("should skip over groups when not consumed", async () => {
      const iterable = iter.groupBy([1, 2, 3, 4, 5], (x) => Math.floor(x / 2));
      const result = await iter.list(iterable, ([index]) => index);

      expect(result).toEqual([0, 1, 2]);
    });

    it("should consume partial groups", async () => {
      const iterable = iter.groupBy([1, 2, 3, 4, 5], (x) => Math.floor(x / 2));
      const result = await iter.list(iterable, async ([index, iterable]) => {
        return [index, await iter.next(iterable)];
      });

      expect(result).toEqual([
        [0, 1],
        [1, 2],
        [2, 4],
      ]);
    });
  });

  describe("slice", () => {
    it("should slice an iterable", async () => {
      const iterable = iter.slice([1, 2, 3, 4, 5], 0, 2);

      expect(await iter.list(iterable)).toEqual([1, 2]);
    });

    it("should exhaust an iterable when range is too large", async () => {
      const iterable = iter.slice([1, 2, 3, 4, 5], 2, 10);

      expect(await iter.list(iterable)).toEqual([3, 4, 5]);
    });

    it("should specify a custom step", async () => {
      const iterable = iter.slice([1, 2, 3, 4, 5], 0, Infinity, 3);

      expect(await iter.list(iterable)).toEqual([1, 4]);
    });
  });

  describe("reduce", () => {
    it("should reduce an iterator to a single value", async () => {
      const result = await iter.reduce(iter.range(0, 5), (x, y) => x + y);

      expect(result).toEqual(10);
    });
  });

  describe("map", () => {
    it("should map iterator values", async () => {
      const iterable = iter.slice(
        iter.map(iter.range(), (x) => x * x),
        0,
        5
      );

      expect(await iter.list(iterable)).toEqual([0, 1, 4, 9, 16]);
    });
  });

  describe("spreadmap", () => {
    it("should spread map iterator values", async () => {
      const iterable = iter.slice(
        iter.spreadmap(iter.zip(iter.range(), iter.range()), (a, b) => a + b),
        0,
        5
      );

      expect(await iter.list(iterable)).toEqual([0, 2, 4, 6, 8]);
    });
  });

  describe("filter", () => {
    it("should filter values from iterator", async () => {
      const iterable = iter.slice(
        iter.filter(iter.range(), (x) => x % 2 === 0),
        0,
        5
      );

      expect(await iter.list(iterable)).toEqual([0, 2, 4, 6, 8]);
    });

    it("should filter with correct output type", async () => {
      const iterable = iter.filter(
        ["a", 1, "b", 2, "c", 3],
        (x): x is string => typeof x === "string"
      );

      expect(await iter.list(iterable)).toEqual(["a", "b", "c"]);
    });
  });

  describe("tee", () => {
    it("should return two independent iterables from one", async () => {
      const iterable = iter.map([1, 2, 3], (x) => x * 2);
      const [a, b] = iter.tee(iterable);

      expect(await iter.list(a)).toEqual([2, 4, 6]);
      expect(await iter.list(b)).toEqual([2, 4, 6]);
    });

    it("should read varying from cache to iterable", async () => {
      const iterable = iter.range(0, 5);
      const [a, b] = iter.tee(iterable).map(iter.iter);

      expect([(await a.next()).value, (await a.next()).value]).toEqual([0, 1]);

      expect([
        (await b.next()).value,
        (await b.next()).value,
        (await b.next()).value,
      ]).toEqual([0, 1, 2]);

      expect([(await a.next()).value, (await a.next()).value]).toEqual([2, 3]);
      expect([(await b.next()).value, (await b.next()).value]).toEqual([3, 4]);

      expect((await a.next()).value).toEqual(4);
      expect((await b.next()).value).toEqual(undefined);
    });

    it("should tee empty iterable", async () => {
      const iterable = iter.range(0, 0);
      const [a, b] = iter.tee(iterable);

      expect(await iter.list(a)).toEqual([]);
      expect(await iter.list(b)).toEqual([]);
    });

    it("should call `next` the right number of times", async () => {
      let i = 0;
      const next = jest.fn(() => ({ value: i++, done: i > 10 }));
      const iterable: Iterable<number> = {
        [Symbol.iterator]: () => ({ next }),
      };

      const [a, b] = iter.tee(iterable);

      // Exhaust both iterables.
      expect(await iter.list(a)).toEqual(await iter.list(iter.range(0, 10)));
      expect(await iter.list(b)).toEqual(await iter.list(iter.range(0, 10)));

      expect(next.mock.calls.length).toEqual(11);
    });
  });

  describe("chunk", () => {
    it("should chunk an iterable", async () => {
      const iterable = iter.chunk([1, 2, 3, 4, 5, 6], 2);

      expect(await iter.list(iterable)).toEqual([
        [1, 2],
        [3, 4],
        [5, 6],
      ]);
    });

    it("should yield last chunk when less than chunk size", async () => {
      const iterable = iter.chunk([1, 2, 3, 4, 5], 3);

      expect(await iter.list(iterable)).toEqual([
        [1, 2, 3],
        [4, 5],
      ]);
    });
  });

  describe("pairwise", () => {
    it("should generate pairwise iterator", async () => {
      const iterable = iter.pairwise([1, 2, 3, 4]);

      expect(await iter.list(iterable)).toEqual([
        [1, 2],
        [2, 3],
        [3, 4],
      ]);
    });

    it("should not generate any values when iterator too small", async () => {
      const iterable = iter.pairwise([1]);

      expect(await iter.list(iterable)).toEqual([]);
    });
  });

  describe("zip", () => {
    it("should zip two iterables", async () => {
      const iterable = iter.zip([1, 2, 3], ["a", "b", "c"]);

      expect(await iter.list(iterable)).toEqual([
        [1, "a"],
        [2, "b"],
        [3, "c"],
      ]);
    });

    it("should stop when an iterable is done", async () => {
      const iterable = iter.zip([1, 2, 3], [1, 2, 3, 4, 5]);

      expect(await iter.list(iterable)).toEqual([
        [1, 1],
        [2, 2],
        [3, 3],
      ]);
    });

    it("should do nothing without iterables", async () => {
      const iterable = iter.zip();

      expect(await iter.list(iterable)).toEqual([]);
    });
  });

  describe("zipLongest", () => {
    it("should zip until the longest value", async () => {
      const iterable = iter.zipLongest(iter.range(0, 2), iter.range(0, 5));

      expectType<
        TypeEqual<
          AsyncIterableIterator<[number | undefined, number | undefined]>,
          typeof iterable
        >
      >(true);

      expect(await iter.list(iterable)).toEqual([
        [0, 0],
        [1, 1],
        [undefined, 2],
        [undefined, 3],
        [undefined, 4],
      ]);
    });

    it("should do nothing without iterables", async () => {
      const iterable = iter.zipLongest();

      expect(await iter.list(iterable)).toEqual([]);
    });
  });

  describe("zipWithValue", () => {
    it("should zip until the longest value", async () => {
      const iterable = iter.zipWithValue(
        "test",
        iter.range(0, 2),
        iter.range(0, 5)
      );

      expectType<
        TypeEqual<
          AsyncIterableIterator<[number | string, number | string]>,
          typeof iterable
        >
      >(true);

      expect(await iter.list(iterable)).toEqual([
        [0, 0],
        [1, 1],
        ["test", 2],
        ["test", 3],
        ["test", 4],
      ]);
    });
  });

  describe("compress", () => {
    it("should compress an iterable based on boolean sequence", async () => {
      const iterable = iter.compress(iter.range(), [true, false, true]);

      expect(await iter.list(iterable)).toEqual([0, 2]);
    });
  });

  describe("sorted", () => {
    it("should return a sorted list", async () => {
      const list = await iter.sorted(iter.slice(iter.cycle([1, 2, 3]), 0, 10));

      expect(list).toEqual([1, 1, 1, 1, 2, 2, 2, 3, 3, 3]);
    });

    it("should return list in reverse order", async () => {
      const list = await iter.sorted(
        iter.slice(iter.range(), 0, 10),
        undefined,
        undefined,
        true
      );

      expect(list).toEqual([9, 8, 7, 6, 5, 4, 3, 2, 1, 0]);
    });

    it("should allow key function", async () => {
      const list = await iter.sorted(
        [{ x: 3 }, { x: 2 }, { x: 1 }],
        (x) => x.x
      );

      expect(list).toEqual([{ x: 1 }, { x: 2 }, { x: 3 }]);
    });

    it("should allow compare function", async () => {
      const list = await iter.sorted(
        [1, 2, 3, 4, 5],
        undefined,
        (x, y) => y - x
      );

      expect(list).toEqual([5, 4, 3, 2, 1]);
    });

    it("should combine key and compare functions", async () => {
      const list = await iter.sorted(
        [{ x: 2 }, { x: 1 }, { x: 3 }],
        (x) => x.x,
        (x, y) => y - x
      );

      expect(list).toEqual([{ x: 3 }, { x: 2 }, { x: 1 }]);
    });
  });

  describe("dict", () => {
    it("should create an object from an iterable", async () => {
      const iterable = iter.zip(iter.range(1, 4), iter.repeat(true));

      expect(await iter.dict(iterable)).toEqual({ 1: true, 2: true, 3: true });
    });
  });

  describe("len", () => {
    it("should count the length of an iterable", async () => {
      const iterable = iter.range(0, 5);

      expect(await iter.len(iterable)).toEqual(5);
    });
  });

  describe("min", () => {
    it("should find the minimum value", async () => {
      expect(await iter.min([1, 5, -2])).toEqual(-2);
    });

    it("should find minimum value by key", async () => {
      const iterable = iter.zip(iter.repeat(true), iter.range(0, 100));

      expect(await iter.min(iterable, (x) => x[1])).toEqual([true, 0]);
    });
  });

  describe("max", () => {
    it("should find the maximum value", async () => {
      expect(await iter.max([1, 5, -2])).toEqual(5);
    });

    it("should find maximum value by key", async () => {
      const iterable = iter.zip(iter.repeat(true), iter.range(0, 100));

      expect(await iter.max(iterable, (x) => x[1])).toEqual([true, 99]);
    });
  });

  describe("sum", () => {
    it("should sum an iterable", async () => {
      expect(await iter.sum(iter.range(0, 10))).toEqual(45);
    });

    it("should sum an iterable with custom start", async () => {
      expect(await iter.sum(iter.range(0, 10), 5)).toEqual(50);
    });
  });

  describe("product", () => {
    it("should generate the product of multiple iterators", async () => {
      const iterable = iter.product("ABCD", "xy");

      const result = [
        ["A", "x"],
        ["A", "y"],
        ["B", "x"],
        ["B", "y"],
        ["C", "x"],
        ["C", "y"],
        ["D", "x"],
        ["D", "y"],
      ];

      expect(await iter.list(iterable)).toEqual(result);
    });
  });

  describe("iterable", () => {
    it("should convert an iterator to iterable", async () => {
      const iterator = iter.iter([1, 2, 3]);
      const iterable = iter.iterable(iterator);

      await iter.next(iterator); // Discard first value.

      expect(await iter.list(iterable)).toEqual([2, 3]);
    });
  });
});
