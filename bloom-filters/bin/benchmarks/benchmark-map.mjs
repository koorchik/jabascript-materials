import fs from "fs";
import readline from "readline";
import { performance } from "perf_hooks";

const FILE_PATH = "generated.data";
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

  console.log(`\n--- Map Test ---`);
  const map = new Map();
  const existingKeys = allKeys.slice(0, TEST_COUNT);

  const memBefore = process.memoryUsage().heapUsed;

  const startAdd = performance.now();
  for (let i = 0; i < allKeys.length; i++) map.set(allKeys[i], 1);
  const endAdd = performance.now();

  const memAfter = process.memoryUsage().heapUsed;

  const startHasExisting = performance.now();
  for (let i = 0; i < existingKeys.length; i++) map.has(existingKeys[i]);
  const endHasExisting = performance.now();

  let falsePositives = 0;
  const startHasMissing = performance.now();
  for (let i = 0; i < missingKeys.length; i++) {
    if (map.has(missingKeys[i])) falsePositives++;
  }
  const endHasMissing = performance.now();

  console.log(`Add time            : ${Math.round(endAdd - startAdd)} ms`);
  console.log(
    `Memory (Heap delta) : ${((memAfter - memBefore) / 1024 / 1024).toFixed(2)} MB`
  );
  console.log(
    `Has (existing) time : ${Math.round(endHasExisting - startHasExisting)} ms`
  );
  console.log(
    `Has (missing) time  : ${Math.round(endHasMissing - startHasMissing)} ms`
  );
  console.log(`False Positives     : ${falsePositives} (0%)`);
}

run().catch(console.error);
