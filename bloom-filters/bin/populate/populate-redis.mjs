import { createClient } from "redis";
import fs from "fs";
import readline from "readline";

const FILE_PATH = "generated.data";
const BATCH_SIZE = 50_000; // Batch size for MSET

async function main() {
  const client = createClient();
  client.on("error", (err) => console.error("Redis Client Error", err));

  console.log("Connecting to Redis...");
  await client.connect();

  console.log("Flushing existing Redis data...");
  await client.flushDb(); // Clear the database before the test

  console.log(
    `Reading ${FILE_PATH} and inserting in batches of ${BATCH_SIZE}...`
  );
  console.time("Total Insertion Time");

  const fileStream = fs.createReadStream(FILE_PATH);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let batch = [];
  let totalInserted = 0;

  for await (const line of rl) {
    if (!line) continue;

    // MSET accepts a flat array: [key1, val1, key2, val2, ...]
    batch.push(line, "1");

    if (batch.length === BATCH_SIZE * 2) {
      await client.mSet(batch);
      totalInserted += BATCH_SIZE;
      batch = [];

      if (totalInserted % 1_000_000 === 0) {
        console.log(`Inserted ${totalInserted} records...`);
      }
    }
  }

  // Insert remaining items
  if (batch.length > 0) {
    await client.mSet(batch);
    totalInserted += batch.length / 2;
  }

  console.timeEnd("Total Insertion Time");
  console.log(`✅ Successfully inserted ${totalInserted} items into Redis.`);

  await client.disconnect();
}

main().catch(console.error);
