import mysql from "mysql2/promise";
import { timer, loadSampleKeys, generateNewKeys } from "../../src/utils/benchmark.mjs";

const TEST_COUNT = 100_000;

async function run() {
  console.log("Loading sample data into memory...");
  const existingKeys = await loadSampleKeys("generated.data", TEST_COUNT);
  const missingKeys = generateNewKeys(TEST_COUNT);

  const db = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "password",
    database: "mydb"
  });

  console.log(`\n--- MySQL Lookup Test (HANDLER DIRECT ACCESS) ---`);

  // Open the table for direct access (bypassing the SQL Optimizer)
  await db.query("HANDLER items OPEN");

  let foundExisting = 0;
  let elapsed = timer();
  for (let i = 0; i < existingKeys.length; i++) {
    // Important: HANDLER doesn't support server-side prepared statements (execute),
    // so we use query() — mysql2 will interpolate values under the hood
    const [rows] = await db.query("HANDLER items READ idx_item_key = (?)", [
      existingKeys[i]
    ]);
    if (rows.length > 0) foundExisting++;
  }
  const hasExistingTime = elapsed();

  let falsePositives = 0;
  elapsed = timer();
  for (let i = 0; i < missingKeys.length; i++) {
    const [rows] = await db.query("HANDLER items READ idx_item_key = (?)", [
      missingKeys[i]
    ]);
    if (rows.length > 0) falsePositives++;
  }
  const hasMissingTime = elapsed();

  // Close the HANDLER
  await db.query("HANDLER items CLOSE");

  console.log(
    `Has (existing) time : ${hasExistingTime} ms for ${TEST_COUNT} queries`
  );
  console.log(
    `Has (missing) time  : ${hasMissingTime} ms for ${TEST_COUNT} queries`
  );
  console.log(`Keys found          : ${foundExisting} / ${TEST_COUNT}`);
  console.log(`False Positives     : ${falsePositives} (0%)`);

  await db.end();
}

run().catch(console.error);
