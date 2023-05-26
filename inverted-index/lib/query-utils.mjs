export function executeQuery(query, entriesByToken) {
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