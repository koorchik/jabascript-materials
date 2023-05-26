export function tokenize(string) {
  return string
    .split(/\s+/)
    .filter(token => !isStopWord(token))
    .map(token => stemmer(token));
}

function isStopWord(token) {
  const stopWords = new Set(['a', 'the', 'is']);
  return (stopWords.has(token) || token.length <= 2);
}

function stemmer(token) {
  return token.replace(/[^\w\s]/gi, '').toLowerCase();
}