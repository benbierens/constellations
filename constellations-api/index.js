import express from 'express';

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Constellations API!' });
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
