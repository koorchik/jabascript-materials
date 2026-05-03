import {
  BloomFilter,
  computeBloomFilterParams
} from "../../src/BloomFilter.mjs";
import fs from "fs";
import {
  timer,
  loadAllKeys,
  generateNewKeys
} from "../../src/utils/benchmark.mjs";

const EXPECTED_ITEMS = 5_000_000;
const FPR_TARGET = 0.01;
const TEST_COUNT = 100_000;

async function run() {
  if (!fs.existsSync("generated.data")) {
    console.error(`Error: File generated.data not found.`);
    return;
  }

  console.log("Loading data into memory...");
  const allKeys = await loadAllKeys("generated.data");
  const missingKeys = generateNewKeys(TEST_COUNT);

  console.log(`\n--- Bloom Filter Test ---`);
  const params = computeBloomFilterParams(EXPECTED_ITEMS, FPR_TARGET);
  const bloom = new BloomFilter(params);
  const existingKeys = allKeys.slice(0, TEST_COUNT);

  const memMB = (bloom.buffer.length * 4) / 1024 / 1024;

  let elapsed = timer();
  for (let i = 0; i < allKeys.length; i++) bloom.add(allKeys[i]);
  const addTime = elapsed();

  elapsed = timer();
  for (let i = 0; i < existingKeys.length; i++) bloom.has(existingKeys[i]);
  const hasExistingTime = elapsed();

  let falsePositives = 0;
  elapsed = timer();
  for (let i = 0; i < missingKeys.length; i++) {
    if (bloom.has(missingKeys[i])) falsePositives++;
  }
  const hasMissingTime = elapsed();

  const fpr = (falsePositives / TEST_COUNT) * 100;

  console.log(`Add time            : ${addTime} ms`);
  console.log(`Memory (Fixed)      : ~${memMB.toFixed(2)} MB`);
  console.log(`Has (existing) time : ${hasExistingTime} ms`);
  console.log(`Has (missing) time  : ${hasMissingTime} ms`);
  console.log(`False Positives     : ${falsePositives} / ${TEST_COUNT}`);
  console.log(`Actual FPR          : ${fpr.toFixed(3)}%`);
}

run().catch(console.error);
