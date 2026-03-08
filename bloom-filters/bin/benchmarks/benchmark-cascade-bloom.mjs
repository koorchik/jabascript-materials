import fs from "fs";
import readline from "readline";
import { performance } from "perf_hooks";
import { CascadeBloomFilter } from "../../src/CascadeBloomFilter.mjs";

const FILE_PATH = "generated.data";
const TEST_COUNT = 100_000;
const POSITIVES_RATIO = 0.1; // 10% dataset = existing (targets), 90% = missing (background)

async function loadAllKeys() {
  const keys = [];
  const rl = readline.createInterface({
    input: fs.createReadStream(FILE_PATH),
    crlfDelay: Infinity
  });

  for await (const line of rl) keys.push(line);
  return keys;
}

async function run() {
  if (!fs.existsSync(FILE_PATH)) {
    console.error(`Error: File ${FILE_PATH} not found.`);
    return;
  }

  console.log("Loading and splitting data into memory...");
  const allKeys = await loadAllKeys();

  // Split dataset: 10% targets, 90% background
  const splitIndex = Math.floor(allKeys.length * POSITIVES_RATIO);
  const positives = allKeys.slice(0, splitIndex); // "Existing" keys
  const negatives = allKeys.slice(splitIndex); // "Missing" keys

  const existingKeys = positives.slice(0, TEST_COUNT);
  const missingKeys = negatives.slice(0, TEST_COUNT);

  console.log(`\n--- Cascade Bloom Filter Test ---`);
  console.log(`Targets (10%)       : ${positives.length.toLocaleString()}`);
  console.log(`Background (90%)    : ${negatives.length.toLocaleString()}`);

  const startAdd = performance.now();
  // Build cascade with 10% FPR per level
  const cascade = new CascadeBloomFilter(positives, negatives, 0.1);
  const endAdd = performance.now();

  // Calculate total memory across all levels
  let totalMemoryMB = 0;
  for (const filter of cascade.levels) {
    totalMemoryMB += (filter.buffer.length * 4) / 1024 / 1024;
  }

  const startHasExisting = performance.now();
  for (let i = 0; i < existingKeys.length; i++) {
    cascade.classify(existingKeys[i]);
  }
  const endHasExisting = performance.now();

  let falsePositives = 0;
  const startHasMissing = performance.now();
  for (let i = 0; i < missingKeys.length; i++) {
    // cascade.classify returns true if it thinks it's a target (positive)
    if (cascade.classify(missingKeys[i])) falsePositives++;
  }
  const endHasMissing = performance.now();

  const fpr = (falsePositives / TEST_COUNT) * 100;

  console.log(`Add time            : ${Math.round(endAdd - startAdd)} ms`);
  console.log(`Memory (Fixed)      : ~${totalMemoryMB.toFixed(2)} MB`);
  console.log(
    `Has (existing) time : ${Math.round(endHasExisting - startHasExisting)} ms`
  );
  console.log(
    `Has (missing) time  : ${Math.round(endHasMissing - startHasMissing)} ms`
  );
  console.log(`False Positives     : ${falsePositives} / ${TEST_COUNT}`);
  console.log(`Actual FPR          : ${fpr.toFixed(3)}%`);
  console.log(`Cascade Levels      : ${cascade.levels.length}`);
}

run().catch(console.error);
