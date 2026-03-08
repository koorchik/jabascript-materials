import memjs from "memjs";
import fs from "fs";
import readline from "readline";

const FILE_PATH = "generated.data";
const BATCH_SIZE = 5_000;

async function main() {
  // memjs creates the connection automatically
  const client = memjs.Client.create("localhost:11211");

  console.log("Flushing Memcached (clearing old data)...");
  await client.flush();

  console.log(
    `Reading ${FILE_PATH} and inserting in parallel batches of ${BATCH_SIZE}...`
  );
  console.time("Total Insertion Time");

  const fileStream = fs.createReadStream(FILE_PATH);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let promises = [];
  let totalInserted = 0;

  for await (const line of rl) {
    if (!line) continue;

    // Send SET command (expires 0 = never expires)
    promises.push(client.set(line, "1", { expires: 0 }));

    if (promises.length === BATCH_SIZE) {
      await Promise.all(promises);
      totalInserted += BATCH_SIZE;
      promises = [];

      if (totalInserted % 1_000_000 === 0) {
        console.log(`Inserted ${totalInserted} records...`);
      }
    }
  }

  if (promises.length > 0) {
    await Promise.all(promises);
    totalInserted += promises.length;
  }

  console.timeEnd("Total Insertion Time");
  console.log(
    `✅ Successfully inserted ${totalInserted} items into Memcached.`
  );

  client.close();
}

main().catch(console.error);
