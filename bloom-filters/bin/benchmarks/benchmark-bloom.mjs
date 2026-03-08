import {
  BloomFilter,
  computeBloomFilterParams
} from "../../src/BloomFilter.mjs";
import fs from "fs";
import readline from "readline";
import { performance } from "perf_hooks";

const FILE_PATH = "generated.data";
const EXPECTED_ITEMS = 10_000_000;
const FPR_TARGET = 0.01;
const TEST_COUNT = 100_000;

function generateMissingKeys(count) {
  return Array.from(
    { length: count },
    (_, i) => `item_999999${i}_${Math.random().toString(36).substring(2, 6)}`
  );
}

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

  console.log("Loading data into memory...");
  const allKeys = await loadAllKeys();
  const missingKeys = generateMissingKeys(TEST_COUNT);

  console.log(`\n--- Bloom Filter Test ---`);
  const params = computeBloomFilterParams(EXPECTED_ITEMS, FPR_TARGET);
  const bloom = new BloomFilter(params);
  const existingKeys = allKeys.slice(0, TEST_COUNT);

  const memMB = (bloom.buffer.length * 4) / 1024 / 1024;

  const startAdd = performance.now();
  for (let i = 0; i < allKeys.length; i++) bloom.add(allKeys[i]);
  const endAdd = performance.now();

  const startHasExisting = performance.now();
  for (let i = 0; i < existingKeys.length; i++) bloom.has(existingKeys[i]);
  const endHasExisting = performance.now();

  let falsePositives = 0;
  const startHasMissing = performance.now();
  for (let i = 0; i < missingKeys.length; i++) {
    if (bloom.has(missingKeys[i])) falsePositives++;
  }
  const endHasMissing = performance.now();

  const fpr = (falsePositives / TEST_COUNT) * 100;

  console.log(`Add time            : ${Math.round(endAdd - startAdd)} ms`);
  console.log(`Memory (Fixed)      : ~${memMB.toFixed(2)} MB`);
  console.log(
    `Has (existing) time : ${Math.round(endHasExisting - startHasExisting)} ms`
  );
  console.log(
    `Has (missing) time  : ${Math.round(endHasMissing - startHasMissing)} ms`
  );
  console.log(`False Positives     : ${falsePositives} / ${TEST_COUNT}`);
  console.log(`Actual FPR          : ${fpr.toFixed(3)}%`);
}

run().catch(console.error);
