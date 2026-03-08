import { BloomFilter, computeBloomFilterParams } from "./BloomFilter.mjs";

export class CascadeBloomFilter {
  /**
   * @param {string[]} positives - Target items (e.g., revoked certificates)
   * @param {string[]} negatives - Background items (e.g., valid certificates)
   * @param {number} fprTarget - FPR per level (0.1 is optimal for cascades)
   */
  constructor(positives, negatives, fprTarget = 0.1) {
    this.levels = [];
    this._buildCascade(positives, negatives, fprTarget);
  }

  _buildCascade(positives, negatives, fprTarget) {
    let currentTargets = positives;
    let currentNonTargets = negatives;

    while (currentTargets.length > 0) {
      // Guard against too few items (Bloom filter math breaks down for N < 10)
      const expectedItems = Math.max(currentTargets.length, 10);
      const params = computeBloomFilterParams(expectedItems, fprTarget);

      const filter = new BloomFilter(params);

      // 1. Add all target items to the current level
      for (const item of currentTargets) {
        filter.add(item);
      }

      this.levels.push(filter);

      // 2. Find false positives among non-target items
      const falsePositives = [];
      for (const item of currentNonTargets) {
        if (filter.has(item)) {
          falsePositives.push(item);
        }
      }

      // If no false positives — the cascade is perfect, stop building
      if (falsePositives.length === 0) {
        break;
      }

      // 3. Swap roles for the next level:
      // The next filter must catch exactly these false positives
      currentNonTargets = currentTargets;
      currentTargets = falsePositives;
    }
  }

  /**
   * Binary classifier: returns true (positive) or false (negative)
   */
  classify(item) {
    if (this.levels.length === 0) return false;

    for (let i = 0; i < this.levels.length; i++) {
      if (!this.levels[i].has(item)) {
        // Even levels (0, 2, 4...) store Positives.
        // If the item is not there, it's definitely Negative.
        // Odd levels (1, 3, 5...) store Negatives (false positives).
        // If the item is not there, it's definitely Positive.
        return i % 2 !== 0;
      }
    }

    // If the item passed all filters (matched everywhere),
    // its status is determined by what the last level was filtering.
    return (this.levels.length - 1) % 2 === 0;
  }
}
