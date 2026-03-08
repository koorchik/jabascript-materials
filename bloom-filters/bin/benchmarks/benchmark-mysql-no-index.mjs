import mysql from "mysql2/promise";
import fs from "fs";
import readline from "readline";
import { performance } from "perf_hooks";

const FILE_PATH = "generated.data";
const TEST_COUNT = 10; // ⚠️ VERY LOW NUMBER due to Full Table Scan!

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
  console.log(`Loading sample data into memory (Only ${TEST_COUNT} items)...`);
  const existingKeys = await loadSampleKeys(TEST_COUNT);
  const missingKeys = generateMissingKeys(TEST_COUNT);

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
  const startHasExisting = performance.now();
  for (let i = 0; i < existingKeys.length; i++) {
    const [rows] = await db.execute(checkQuery, [existingKeys[i]]);
    if (rows.length > 0) foundExisting++;
  }
  const endHasExisting = performance.now();

  let falsePositives = 0;
  const startHasMissing = performance.now();
  for (let i = 0; i < missingKeys.length; i++) {
    const [rows] = await db.execute(checkQuery, [missingKeys[i]]);
    if (rows.length > 0) falsePositives++;
  }
  const endHasMissing = performance.now();

  console.log(
    `Has (existing) time : ${Math.round(endHasExisting - startHasExisting)} ms for ${TEST_COUNT} queries`
  );
  console.log(
    `Has (missing) time  : ${Math.round(endHasMissing - startHasMissing)} ms for ${TEST_COUNT} queries`
  );

  // Projected time if we did 100,000 queries
  const projectedTime = Math.round(
    (endHasMissing - startHasMissing) * (100000 / TEST_COUNT)
  );
  console.log(
    `\n🕒 If we did 100,000 queries like Bloom/Map, it would take ~${Math.round(projectedTime / 1000 / 60)} MINUTES!`
  );

  await db.end();
}

run().catch(console.error);
