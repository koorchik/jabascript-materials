import binarySearchInFile from "../lib/binary-search-in-file.mjs";
import { tokenize } from "../lib/language-utils.mjs";
import { decompressEntries } from "../lib/compress-utils.mjs";


const search = process.argv[2] || '';
const exactOrder = process.argv[3] === 'exact';

await main(search, exactOrder);

async function main(search, exactOrder) {
  console.log(`Searching "${search}"`);
  console.time('searchInIndex');
  const docIds = await searchInIndex({
    indexFile: './data/index-with-deltas-vbyte.data',
    search,
    exactOrder
  });
  console.timeEnd('searchInIndex');

  console.log(docIds);
}

async function searchInIndex({ indexFile, search, exactOrder } = {}) {
  const tokens = tokenize(search);
  const entriesByToken = await loadEntriesFromIndex(tokens, indexFile);
  return executeQuery({ tokens, exactOrder }, entriesByToken);
}

async function loadEntriesFromIndex(tokens, filename) {
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
      entriesByToken[token] = decompressEntries(data);
    }
  }
  return entriesByToken;
}

function executeQuery(query, entriesByToken) {
  const candidateDocs = { ...entriesByToken[query.tokens[0]] };

  for (let i = 1; i < query.tokens.length; i++) {
    const token = query.tokens[i];
    for (const docId of Object.keys(candidateDocs)) {
      const expectedPosition = candidateDocs[docId] + 1;
      const entries = entriesByToken[token];
      if (!(docId in entries)) {
        delete candidateDocs[docId];
      } else if (query.exactOrder && (entries[docId] !== expectedPosition)) {
        delete candidateDocs[docId];
      } else {
        // last checked token position
        candidateDocs[docId] = expectedPosition;
      }
    }
  }

  return Object.keys(candidateDocs);
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