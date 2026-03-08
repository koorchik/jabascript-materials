import fs from "fs";
import { CascadeBloomFilter } from "../../src/CascadeBloomFilter.mjs";
import { timer, loadAllKeys } from "../../src/utils/benchmark.mjs";

const TEST_COUNT = 100_000;
const POSITIVES_RATIO = 0.1; // 10% dataset = existing (targets), 90% = missing (background)

async function run() {
  if (!fs.existsSync("generated.data")) {
    console.error(`Error: File generated.data not found.`);
    return;
  }

  console.log("Loading and splitting data into memory...");
  const allKeys = await loadAllKeys("generated.data");

  // Split dataset: 10% targets, 90% background
  const splitIndex = Math.floor(allKeys.length * POSITIVES_RATIO);
  const positives = allKeys.slice(0, splitIndex); // "Existing" keys
  const negatives = allKeys.slice(splitIndex); // "Missing" keys

  const existingKeys = positives.slice(0, TEST_COUNT);
  const missingKeys = negatives.slice(0, TEST_COUNT);

  console.log(`\n--- Cascade Bloom Filter Test ---`);
  console.log(`Targets (10%)       : ${positives.length.toLocaleString()}`);
  console.log(`Background (90%)    : ${negatives.length.toLocaleString()}`);

  let elapsed = timer();
  // Build cascade with 10% FPR per level
  const cascade = new CascadeBloomFilter(positives, negatives, 0.1);
  const addTime = elapsed();

  // Calculate total memory across all levels
  let totalMemoryMB = 0;
  for (const filter of cascade.levels) {
    totalMemoryMB += (filter.buffer.length * 4) / 1024 / 1024;
  }

  elapsed = timer();
  for (let i = 0; i < existingKeys.length; i++) {
    cascade.classify(existingKeys[i]);
  }
  const hasExistingTime = elapsed();

  let falsePositives = 0;
  elapsed = timer();
  for (let i = 0; i < missingKeys.length; i++) {
    // cascade.classify returns true if it thinks it's a target (positive)
    if (cascade.classify(missingKeys[i])) falsePositives++;
  }
  const hasMissingTime = elapsed();

  const fpr = (falsePositives / TEST_COUNT) * 100;

  console.log(`Add time            : ${addTime} ms`);
  console.log(`Memory (Fixed)      : ~${totalMemoryMB.toFixed(2)} MB`);
  console.log(`Has (existing) time : ${hasExistingTime} ms`);
  console.log(`Has (missing) time  : ${hasMissingTime} ms`);
  console.log(`False Positives     : ${falsePositives} / ${TEST_COUNT}`);
  console.log(`Actual FPR          : ${fpr.toFixed(3)}%`);
  console.log(`Cascade Levels      : ${cascade.levels.length}`);
}

run().catch(console.error);
