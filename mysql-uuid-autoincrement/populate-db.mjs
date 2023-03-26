import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

const db = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password', 
    database: 'mydb'
});

const wordsData = await fs.readFile('words');
const words = wordsData.toString().split(/\s+/);

function randomWords(count = 1) {
    const selectedWords  = [];

    for (let i = 0; i < count; i++) {
        const wordIdx = Math.floor(Math.random()*words.length);
        selectedWords.push(words[wordIdx]);
    }

    return selectedWords.join(' ');
}

async function main() {
    await populateProducts();

    process.exit();
}

main();

async function populateProducts() {
    const BATCH_SIZE = 1_000;
    const TOTAL_BATCHES = 20_000;
    for (let i=0; i<TOTAL_BATCHES; i++) {
        const key = `BATCH ${i} of size ${BATCH_SIZE}`;
        console.time(key);
        await db.query('START TRANSACTION');
        for (let k=0; k<BATCH_SIZE; k++) {
            const product = generateProduct(i*BATCH_SIZE+k);
            await db.query('INSERT INTO products_uuid_column SET ?', product);

            product.id = product.uuid;
            delete product.uuid;
            await db.query('INSERT INTO products_uuid_pk SET ?', product);

            product.id = null;
            delete product.uuid;
            await db.query('INSERT INTO products SET ?', product);
        }
        await db.query('COMMIT');
        console.timeEnd(key);
    }
}

function generateProduct(number) {
    return {
        id: null,
        uuid: uuidv4(),
        number,
        name: randomWords(3),
        description: randomWords(20),
        brand: randomWords(1),
        price: Math.ceil(Math.random() * 1_000_000),
        year: Math.ceil(Math.random() * 20) + 2000
    }
}
