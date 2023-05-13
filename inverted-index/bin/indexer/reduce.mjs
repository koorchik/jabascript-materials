import hadoopUtils from 'hadoop-streaming-utils';
import { compressEntries } from '../../lib/compress-utils.mjs';

async function main() {
  hadoopUtils.iterateKeysWithGroupedJsonValues((token, entries) => {
    process.stdout.write(token + '\t' + JSON.stringify(compressEntries(entries)) + '\n'); {}
  });
}

main();