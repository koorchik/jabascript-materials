import mysql from "mysql2/promise";
import { timer, loadSampleKeys, generateNewKeys } from "../../src/utils/benchmark.mjs";

const TEST_COUNT = 10; // ⚠️ VERY LOW NUMBER due to Full Table Scan!

async function run() {
  console.log(`Loading sample data into memory (Only ${TEST_COUNT} items)...`);
  const existingKeys = await loadSampleKeys("generated.data", TEST_COUNT);
  const missingKeys = generateNewKeys(TEST_COUNT);

  const db = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "password",
    database: "mydb"
  });

  console.log("Dropping INDEX if it exists to force Full Table Scan...");

  // Workaround for missing "IF EXISTS" in MySQL DROP INDEX
  try {
    await db.query("DROP INDEX idx_item_key ON items");
    console.log("✅ Index dropped successfully.");
  } catch (error) {
    // Error 1091 means "Can't DROP 'idx_item_key'; check that column/key exists"
    if (error.errno === 1091) {
      console.log("ℹ️ Index didn't exist, moving on.");
    } else {
      throw error; // Re-throw if it's a different error
    }
  }

  console.log(`\n--- MySQL Lookup Test (NO INDEX - FULL TABLE SCAN) ---`);
  console.log(
    `⚠️ Testing ONLY ${TEST_COUNT} queries because it will be EXTREMELY slow.`
  );

  await db.query("SELECT 1"); // Warmup

  const checkQuery = "SELECT 1 FROM items WHERE item_key = ? LIMIT 1";

  let foundExisting = 0;
  let elapsed = timer();
  for (let i = 0; i < existingKeys.length; i++) {
    const [rows] = await db.execute(checkQuery, [existingKeys[i]]);
    if (rows.length > 0) foundExisting++;
  }
  const hasExistingTime = elapsed();

  let falsePositives = 0;
  elapsed = timer();
  for (let i = 0; i < missingKeys.length; i++) {
    const [rows] = await db.execute(checkQuery, [missingKeys[i]]);
    if (rows.length > 0) falsePositives++;
  }
  const hasMissingTime = elapsed();

  console.log(
    `Has (existing) time : ${hasExistingTime} ms for ${TEST_COUNT} queries`
  );
  console.log(
    `Has (missing) time  : ${hasMissingTime} ms for ${TEST_COUNT} queries`
  );

  // Projected time if we did 100,000 queries
  const projectedTime = Math.round(hasMissingTime * (100000 / TEST_COUNT));
  console.log(
    `\n🕒 If we did 100,000 queries like Bloom/Map, it would take ~${Math.round(projectedTime / 1000 / 60)} MINUTES!`
  );

  await db.end();
}

run().catch(console.error);
