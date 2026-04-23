import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

import moviesRouter from './routes/movies';
import usersRouter from './routes/users';
import matchRouter from './routes/match';

app.use('/api/movies', moviesRouter);
app.use('/api/users', usersRouter);
app.use('/api/match', matchRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Matchflix API is running' });
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

export default app;
