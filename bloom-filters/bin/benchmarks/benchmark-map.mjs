import fs from "fs";
import { timer, loadAllKeys, generateNewKeys } from "../../src/utils/benchmark.mjs";

const TEST_COUNT = 100_000;

async function run() {
  if (!fs.existsSync("generated.data")) {
    console.error(`Error: File generated.data not found.`);
    return;
  }

  console.log("Loading data into memory...");
  const allKeys = await loadAllKeys("generated.data");
  const missingKeys = generateNewKeys(TEST_COUNT);

  console.log(`\n--- Map Test ---`);
  const map = new Map();
  const existingKeys = allKeys.slice(0, TEST_COUNT);

  const memBefore = process.memoryUsage().heapUsed;

  let elapsed = timer();
  for (let i = 0; i < allKeys.length; i++) map.set(allKeys[i], 1);
  const addTime = elapsed();

  const memAfter = process.memoryUsage().heapUsed;

  elapsed = timer();
  for (let i = 0; i < existingKeys.length; i++) map.has(existingKeys[i]);
  const hasExistingTime = elapsed();

  let falsePositives = 0;
  elapsed = timer();
  for (let i = 0; i < missingKeys.length; i++) {
    if (map.has(missingKeys[i])) falsePositives++;
  }
  const hasMissingTime = elapsed();

  console.log(`Add time            : ${addTime} ms`);
  console.log(
    `Memory (Heap delta) : ${((memAfter - memBefore) / 1024 / 1024).toFixed(2)} MB`
  );
  console.log(`Has (existing) time : ${hasExistingTime} ms`);
  console.log(`Has (missing) time  : ${hasMissingTime} ms`);
  console.log(`False Positives     : ${falsePositives} (0%)`);
}

run().catch(console.error);
