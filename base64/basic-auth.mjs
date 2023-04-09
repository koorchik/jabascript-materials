import express from 'express';
import basicAuth from 'express-basic-auth';

const app = express();

const users = {
  viktor: 'mypassword'
};

app.use(basicAuth({
  users: users,
  challenge: true
}));

app.get('/', (req, res) => {
  res.send('Hello, world!');
});

app.listen(3000, () => {
  console.log('Server started on port 3000');
});
