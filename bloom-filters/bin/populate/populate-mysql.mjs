import mysql from "mysql2/promise";
import fs from "fs";
import readline from "readline";

const FILE_PATH = "generated.data";
const BATCH_SIZE = 10_000;

async function main() {
  console.log("Connecting to database...");
  const db = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "password",
    database: "mydb"
  });

  console.log("Creating table WITHOUT index...");
  await db.query(`
        CREATE TABLE IF NOT EXISTS items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            item_key VARCHAR(255) NOT NULL
        )
    `);

  await db.query("TRUNCATE TABLE items");

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
    batch.push([line]);

    if (batch.length === BATCH_SIZE) {
      await db.query("INSERT INTO items (item_key) VALUES ?", [batch]);
      totalInserted += batch.length;
      batch = [];
      if (totalInserted % 1_000_000 === 0)
        console.log(`Inserted ${totalInserted} records...`);
    }
  }

  if (batch.length > 0) {
    await db.query("INSERT INTO items (item_key) VALUES ?", [batch]);
    totalInserted += batch.length;
  }

  console.timeEnd("Total Insertion Time");
  console.log(`✅ Successfully inserted ${totalInserted} items.`);
  await db.end();
}

main().catch(console.error);
