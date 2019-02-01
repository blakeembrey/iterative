/**
 * Throw when iterator is `done`.
 */
export class StopIteration extends Error {
  constructor() {
    super("Iterator is already marked as done");
  }
}

/**
 * Unique object for comparisons.
 */
export const SENTINEL = Symbol("SENTINEL");

/**
 * Identity function. Returns input as output.
 */
export const identity = <T>(x: T): T => x;

/**
 * Compare the two objects x and y and return an integer according to the
 * outcome. The return value is negative if `x < y`, positive if `x > y`,
 * otherwise zero.
 */
export function cmp<T>(x: T, y: T) {
  return x > y ? 1 : x < y ? -1 : 0;
}
