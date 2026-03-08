import { createClient } from "redis";
import { timer, loadSampleKeys, generateNewKeys } from "../../src/utils/benchmark.mjs";

const TEST_COUNT = 100_000;

async function run() {
  console.log("Loading sample data into memory...");
  const existingKeys = await loadSampleKeys("generated.data", TEST_COUNT);
  const missingKeys = generateNewKeys(TEST_COUNT);

  const client = createClient();
  await client.connect();

  console.log(`\n--- Redis Lookup Test ---`);
  await client.ping(); // Warmup (warm up the connection)

  let foundExisting = 0;
  let elapsed = timer();
  for (let i = 0; i < existingKeys.length; i++) {
    // The exists method returns 1 (if present) or 0 (if absent)
    const exists = await client.exists(existingKeys[i]);
    if (exists) foundExisting++;
  }
  const hasExistingTime = elapsed();

  let falsePositives = 0;
  elapsed = timer();
  for (let i = 0; i < missingKeys.length; i++) {
    const exists = await client.exists(missingKeys[i]);
    if (exists) falsePositives++;
  }
  const hasMissingTime = elapsed();

  console.log(
    `Has (existing) time : ${hasExistingTime} ms for ${TEST_COUNT} queries`
  );
  console.log(
    `Has (missing) time  : ${hasMissingTime} ms for ${TEST_COUNT} queries`
  );
  console.log(`Keys found          : ${foundExisting} / ${TEST_COUNT}`);
  console.log(`False Positives     : ${falsePositives} (0%)`);

  await client.disconnect();
}

run().catch(console.error);
