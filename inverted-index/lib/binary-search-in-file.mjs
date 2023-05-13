import fs from 'fs/promises';

const DEFAULT_COMPARE_FN = async (searchValue, candidateValue) => {
  if (searchValue > candidateValue) {
    return 1;
  } else if (searchValue < candidateValue) {
    return -1;
  } else {
    return 0;
  }
};

const DEFAULT_CHUNK_SIZE = 4000;
const DEFAULT_DELIMITER = "\n";

async function readChunk({ fileHandle, chunkSize, position }) {
  const { buffer, bytesRead } = await fileHandle.read({
    buffer: Buffer.alloc(chunkSize),
    length: chunkSize,
    position: position
  });

  const bufferCorrectSize = Buffer.allocUnsafe(bytesRead);
  buffer.copy(bufferCorrectSize, 0, 0, bytesRead);

  return bufferCorrectSize.toString();
}

export default async function binarySearchInFile({
  filename,
  searchValue,
  compareFn = DEFAULT_COMPARE_FN,
  chunkSize = DEFAULT_CHUNK_SIZE,
  delimiter = DEFAULT_DELIMITER,
} = {}) {
  if (!filename) throw new Error('"filename" required');
  if (!searchValue) throw new Error('"searchValue" required');

  const fileHandle = await fs.open(filename, 'r');
  const stats = await fileHandle.stat();

  let start = 0;
  let end = stats.size;

  while (start < end) {
    let mid = Math.floor((start + end) / 2);

    let readMore = true;
    let data = '';
    let parts = [];
    let position = mid;

    while (readMore) {
      data += await readChunk({ fileHandle, chunkSize, position });
      parts = data.split(delimiter);
      position += chunkSize;
      readMore = (mid === 0 && parts.length < 2) || parts.length < 3;
      if (position > stats.size) {
        return { found: false };
      }
    }

    const midLine = mid === 0 ? parts[0] : parts[1];
    const cmpResult = await compareFn(searchValue, midLine);

    if (cmpResult === 0) {
      await fileHandle.close();
      return { found: true, record: midLine };
    }

    if (cmpResult === 1) {
      start = mid;
    } else {
      end = mid;
    }

    if (start === mid && (end - start) === 1) {
      return { found: false };
    }
  }

  return { found: false, record: null };
}