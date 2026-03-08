import mysql from "mysql2/promise";
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

  const db = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "password",
    database: "mydb"
  });

  console.log(
    "Creating INDEX (this might take a moment if it doesn't exist)..."
  );

  // Workaround for missing "IF NOT EXISTS" in MySQL CREATE INDEX
  try {
    await db.query("CREATE INDEX idx_item_key ON items(item_key)");
    console.log("✅ Index created successfully.");
  } catch (error) {
    // Error 1061 means "Duplicate key name 'idx_item_key'"
    if (error.errno === 1061) {
      console.log("ℹ️ Index already exists, moving on.");
    } else {
      throw error; // Re-throw if it's a different error
    }
  }

  console.log(`\n--- MySQL Lookup Test (WITH INDEX) ---`);

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
  console.log(`Keys found          : ${foundExisting} / ${TEST_COUNT}`);
  console.log(`False Positives     : ${falsePositives} (0%)`);

  await db.end();
}

run().catch(console.error);
