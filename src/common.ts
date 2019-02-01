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
