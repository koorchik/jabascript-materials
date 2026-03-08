import fs from "fs";
import readline from "readline";
import { performance } from "perf_hooks";

export function timer() {
  const start = performance.now();
  return () => Math.round(performance.now() - start);
}

export async function loadAllKeys(filePath) {
  const keys = [];
  const rl = readline.createInterface({
    input: fs.createReadStream(filePath),
    crlfDelay: Infinity
  });

  for await (const line of rl) keys.push(line);
  return keys;
}

export async function loadSampleKeys(filePath, count) {
  const keys = [];
  const rl = readline.createInterface({
    input: fs.createReadStream(filePath),
    crlfDelay: Infinity
  });
  for await (const line of rl) {
    keys.push(line);
    if (keys.length >= count) break;
  }
  return keys;
}

export function generateNewKeys(count) {
  return Array.from(
    { length: count },
    (_, i) => `item_${i}_${Math.random().toString(36).substring(2, 10)}`
  );
}
