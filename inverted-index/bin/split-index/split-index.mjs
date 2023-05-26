import fs from 'fs';
import readline from 'readline';
import { decode } from 'base64-arraybuffer';

const INPUT_INDEX_FILE = 'data/index.data';
const OUTPUT_TOKENS_FILE = 'data/split-index/tokens.data';
const OUTPUT_ENTRIES_FILE = 'data/split-index/entries.data';

await splitIndexFile({
  inputIndexFile: INPUT_INDEX_FILE,
  outputTokensFile: OUTPUT_TOKENS_FILE,
  outputEntriesFile: OUTPUT_ENTRIES_FILE
});

async function splitIndexFile(args) {
  const fileStream = fs.createReadStream(args.inputIndexFile);
  const tokenFile = fs.createWriteStream(args.outputTokensFile);
  const stringFile = fs.createWriteStream(args.outputEntriesFile);

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let currentPosition = 0;

  for await (let line of rl) {
    const parts = line.split('\t');
    if (parts.length === 2) {
      const token = parts[0];
      const entries = Buffer.from(decode(JSON.parse(parts[1])));
      const entriesSize = entries.byteLength;

      const tokenData = `${token}\t${currentPosition}\t${entriesSize}\n`;

      await tokenFile.write(tokenData);
      await stringFile.write(entries);

      currentPosition += entriesSize;
    }
  }

  tokenFile.end();
  stringFile.end();
}



