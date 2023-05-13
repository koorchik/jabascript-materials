import DB from '../../lib/db.mjs';
import { tokenize } from '../../lib/language-utils.mjs';

const db = new DB();

const BATCH_SIZE = 100_000;

async function main() {
  const totalProducts = await db.getProductsCount();
  const totalBatches = Math.ceil(totalProducts / BATCH_SIZE);

  for (let i = 0; i < totalBatches; i++) {
    const rows = await db.getProducts({ limit: BATCH_SIZE, offset: i * BATCH_SIZE });
    printPairs(rows);
  }

  process.exit();
}

function printPairs(rows) {
  for (const row of rows) {
    const tokens = tokenize(row.description);

    for (let i = 0; i < tokens.length; i++) {
      process.stdout.write(tokens[i] + '\t' + JSON.stringify([row.id, i]) + '\n')
    }
  }
}

main();