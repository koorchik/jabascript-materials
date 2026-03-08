import { xxh64 } from "@node-rs/xxhash";

export function computeBloomFilterParams(expectedItems, falsePositiveRate) {
  const sizeInBits = Math.ceil(
    -(expectedItems * Math.log(falsePositiveRate)) / Math.log(2) ** 2
  );
  const numHashes = Math.round((sizeInBits / expectedItems) * Math.log(2));

  return { sizeInBits, numHashes };
}

export class BloomFilter {
  constructor({ sizeInBits, numHashes }) {
    this.sizeInBits = sizeInBits;
    this.numHashes = numHashes;

    this.buffer = new Uint32Array(Math.ceil(sizeInBits / 32));
  }

  _getBitIndices(item) {
    const str = String(item);

    const hash64 = xxh64(str);
    const hashA = Number(hash64 & 0xffffffffn);
    const hashB = Number(hash64 >> 32n);

    const indices = [];

    for (let i = 0; i < this.numHashes; i++) {
      const combinedHash = (hashA + i * hashB) >>> 0;
      indices.push(combinedHash % this.sizeInBits);
    }

    return indices;
  }

  add(item) {
    const indices = this._getBitIndices(item);

    for (const index of indices) {
      const arrayPos = Math.floor(index / 32); // Find the needed element in the array
      const bitPos = index % 32; // Find the bit position within that element

      // Set the bit
      this.buffer[arrayPos] |= 1 << bitPos;
    }
  }

  has(item) {
    const indices = this._getBitIndices(item);

    for (const index of indices) {
      const arrayPos = Math.floor(index / 32);
      const bitPos = index % 32;

      // If at least one bit is zero — the element is definitely not present
      if ((this.buffer[arrayPos] & (1 << bitPos)) === 0) {
        return false;
      }
    }

    // If all bits are set — the element is probably present
    return true;
  }
}
