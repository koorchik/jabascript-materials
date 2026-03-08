import memjs from "memjs";
import { timer, loadSampleKeys, generateNewKeys } from "../../src/utils/benchmark.mjs";

const TEST_COUNT = 100_000;

async function run() {
  console.log("Loading sample data into memory...");
  const existingKeys = await loadSampleKeys("generated.data", TEST_COUNT);
  const missingKeys = generateNewKeys(TEST_COUNT);

  const client = memjs.Client.create("localhost:11211");

  console.log(`\n--- Memcached Lookup Test ---`);

  // Memcached has no ping method, just do an empty request to warm up
  await client.get("warmup_key");

  let foundExisting = 0;
  let elapsed = timer();
  for (let i = 0; i < existingKeys.length; i++) {
    const { value } = await client.get(existingKeys[i]);
    if (value) foundExisting++;
  }
  const hasExistingTime = elapsed();

  let falsePositives = 0;
  elapsed = timer();
  for (let i = 0; i < missingKeys.length; i++) {
    const { value } = await client.get(missingKeys[i]);
    if (value) falsePositives++;
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

  client.close();
}

run().catch(console.error);
