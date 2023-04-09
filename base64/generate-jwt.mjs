import JWT from 'jsonwebtoken';
const SECRET = 'SOME SUPER SECURE SECRET PHRASE';
const token = JWT.sign({ userId: 'viktor' }, SECRET);
console.log(token);
