import { binarySearchInFile } from "../lib/binary-search-utils.mjs";
import { tokenize } from "../lib/language-utils.mjs";
import { decompressEntries } from "../lib/compress-utils.mjs";
import { executeQuery } from "../lib/query-utils.mjs";

const search = process.argv[2] || '';
const exactOrder = process.argv[3] === 'exact';

await main(search, exactOrder);

async function main(search, exactOrder) {
  console.log(`Searching "${search}"`);

  const docIds = await searchInIndex({
    indexFile: './data/index.data',
    search,
    exactOrder
  });

  console.log(docIds);
}

async function searchInIndex({ indexFile, search, exactOrder } = {}) {
  const tokens = tokenize(search);
  const entriesByToken = await loadEntriesFromIndex(tokens, indexFile);
  console.time('Execute query');
  const docIds = executeQuery({ tokens, exactOrder }, entriesByToken);
  console.timeEnd('Execute query');
  return docIds;
}

async function loadEntriesFromIndex(tokens, filename) {
  console.time('Search tokens and load entries');
  const results = await Promise.all(
    tokens.map(
      token => binarySearchInFile({ filename, compareFn, searchValue: token })
    )
  );

  const entriesByToken = {};
  for (const result of results) {
    if (result.found) {
      const [token, json] = result.record.split('\t');
      const data = JSON.parse(json);
      entriesByToken[token] = decompressEntries(data, true);
    }
  }
  console.timeEnd('Search tokens and load entries');
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