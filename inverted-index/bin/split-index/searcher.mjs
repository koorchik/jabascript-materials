import { binarySearchInArray, readChunk } from "../../lib/binary-search-utils.mjs";
import { tokenize } from "../../lib/language-utils.mjs";
import { decompressEntries } from "../../lib/compress-utils.mjs";
import { executeQuery } from "../../lib/query-utils.mjs";
import fs from 'fs/promises';

const search = process.argv[2] || '';
const exactOrder = process.argv[3] === 'exact';

await main(search, exactOrder);

async function main(search, exactOrder) {
  console.log(`Searching "${search}"`);

  const docIds = await searchInIndex({
    indexTokensFile: './data/split-index/tokens.data',
    indexEntriesFile: './data/split-index/entries.data',
    search,
    exactOrder
  });

  console.log(docIds);
}

async function searchInIndex({ indexTokensFile, indexEntriesFile, search, exactOrder } = {}) {
  const tokens = tokenize(search);
  const entriesByToken = await loadEntriesFromIndex(tokens, indexTokensFile, indexEntriesFile);
  console.time('Execute query');
  const docIds = executeQuery({ tokens, exactOrder }, entriesByToken);
  console.timeEnd('Execute query');
  return docIds;
}

async function loadEntriesFromIndex(tokens, indexTokensFile, indexEntriesFile) {
  console.time('Read tokens file');
  const tokensFileData = await fs.readFile(indexTokensFile);
  console.timeEnd('Read tokens file');
  const tokensFileLines = tokensFileData.toString().split('\n');

  console.time('Search tokens');
  const results = tokens.map(
    token => binarySearchInArray({
      array: tokensFileLines,
      compareFn,
      searchValue: token
    })
  );
  console.timeEnd('Search tokens');

  console.time('Load entries');
  const indexEntriesFH = await fs.open(indexEntriesFile, 'r');
  const entriesByToken = Object.fromEntries(await Promise.all(
    results.map(async (result) => {
      if (!result.found) return [result.searchValue, undefined];

      const [token, position, entryLength] = result.record.split('\t');
      const entries = await readChunk({
        position: position,
        chunkSize: entryLength,
        fileHandle: indexEntriesFH
      });

      return [token, decompressEntries(entries)];
    })
  ));
  console.timeEnd('Load entries');

  return entriesByToken;
}

function compareFn(searchValue, candidateValue) {
  const [token] = candidateValue.split('\t');
  if (searchValue > token) {
    return 1;
  } else if (searchValue < token) {
    return -1;
  } else {
    return 0;
  }
}