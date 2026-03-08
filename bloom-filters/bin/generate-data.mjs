import { createWriteStream } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { generateNewKeys } from "../src/utils/benchmark.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, "..", "generated.data");

const TOTAL_ITEMS = 10_000_000;

console.error(`Starting generation of ${TOTAL_ITEMS} records...`);
console.error(`File: ${OUTPUT_PATH}`);

const stream = createWriteStream(OUTPUT_PATH);
const keys = generateNewKeys(TOTAL_ITEMS);

for (let i = 0; i < keys.length; i++) {
  stream.write(keys[i] + "\n");
}

stream.end(() => {
  console.error("Done!");
});
