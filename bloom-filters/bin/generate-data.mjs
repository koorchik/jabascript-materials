import { createWriteStream } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, "..", "generated.data");

const TOTAL_ITEMS = 10_000_000;

console.error(`Starting generation of ${TOTAL_ITEMS} records...`);
console.error(`File: ${OUTPUT_PATH}`);

const stream = createWriteStream(OUTPUT_PATH);

for (let i = 0; i < TOTAL_ITEMS; i++) {
  const randomPart = Math.random().toString(36).substring(2, 10);

  stream.write(`item_${i}_${randomPart}\n`);
}

stream.end(() => {
  console.error("Done!");
});
