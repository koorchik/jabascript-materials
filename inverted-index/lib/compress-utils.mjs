import FastIntegerCompression from 'fastintcompression';
import {encode, decode} from 'base64-arraybuffer';

export function compressEntries(entry) {
  entry.sort((a, b) => a[0] - b[0]);

  const deltaCompressed = [];

  let previousId = 0;
  for (const item of entry) {
    const currentId = item[0];
    const delta = currentId - previousId;
    previousId = currentId;

    deltaCompressed.push(delta);
    deltaCompressed.push(item[1]);
  }

  return encode(FastIntegerCompression.compress(deltaCompressed));
}

export function decompressEntries(data, decodeBase64 = false) {
  const numbers = FastIntegerCompression.uncompress(decodeBase64 ? decode(data): data);
  const entries = {};

  let prevDocId = 0;
  for (let i = 0; i < numbers.length; i += 2) {
    const docId = prevDocId + numbers[i]; // add delta
    const tokenPosition = numbers[i + 1];
    entries[docId] = tokenPosition;
    prevDocId = docId;
  }

  return entries;
}