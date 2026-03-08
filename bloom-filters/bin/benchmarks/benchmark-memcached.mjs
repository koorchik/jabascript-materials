import memjs from "memjs";
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

async function loadSampleKeys(count) {
  const keys = [];
  const rl = readline.createInterface({
    input: fs.createReadStream(FILE_PATH),
    crlfDelay: Infinity
  });
  for await (const line of rl) {
    keys.push(line);
    if (keys.length >= count) break;
  }
  return keys;
}

async function run() {
  console.log("Loading sample data into memory...");
  const existingKeys = await loadSampleKeys(TEST_COUNT);
  const missingKeys = generateMissingKeys(TEST_COUNT);

  const client = memjs.Client.create("localhost:11211");

  console.log(`\n--- Memcached Lookup Test ---`);

  // Memcached has no ping method, just do an empty request to warm up
  await client.get("warmup_key");

  let foundExisting = 0;
  const startHasExisting = performance.now();
  for (let i = 0; i < existingKeys.length; i++) {
    const { value } = await client.get(existingKeys[i]);
    if (value) foundExisting++;
  }
  const endHasExisting = performance.now();

  let falsePositives = 0;
  const startHasMissing = performance.now();
  for (let i = 0; i < missingKeys.length; i++) {
    const { value } = await client.get(missingKeys[i]);
    if (value) falsePositives++;
  }
  const endHasMissing = performance.now();

  console.log(
    `Has (existing) time : ${Math.round(endHasExisting - startHasExisting)} ms for ${TEST_COUNT} queries`
  );
  console.log(
    `Has (missing) time  : ${Math.round(endHasMissing - startHasMissing)} ms for ${TEST_COUNT} queries`
  );
  console.log(`Keys found          : ${foundExisting} / ${TEST_COUNT}`);
  console.log(`False Positives     : ${falsePositives} (0%)`);

  client.close();
}

run().catch(console.error);
