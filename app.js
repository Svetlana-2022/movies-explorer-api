const dotenv = require('dotenv');
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const { errors } = require('celebrate');
const { celebrateBodyUser, celebrateBodyAuth } = require('./validators/users');
const { createUser, login } = require('./controllers/user');
const { auth } = require('./middlewares/auth');
const NotFoundError = require('./errors/NotFoundError');
const { requestLogger, errorLogger } = require('./middlewares/logger');

const INTERNAL_SERVER_ERROR = 500;

const { NODE_ENV } = process.env;

const config = dotenv.config({
  path: NODE_ENV === 'production' ? '.env' : '.env.common',
}).parsed;

const { PORT, BASE_URL } = process.env;

const app = express();

mongoose.connect(BASE_URL);

app.set('config', config);
app.use(cors({
  origin: '*',
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(bodyParser.json());
app.use(requestLogger); // подключаем логгер запросов
app.get('/crash-test', () => {
  setTimeout(() => {
    throw new Error('Сервер сейчас упадёт');
  }, 0);
});
app.post('/signup', celebrateBodyUser, createUser);
app.post('/signin', celebrateBodyAuth, login);

app.use(auth);
app.use('/', require('./routes/user'));
app.use('/', require('./routes/movie'));

app.all('/*', (req, res, next) => {
  next(new NotFoundError('Маршрут не найден'));
});
app.use(errorLogger); // подключаем логгер ошибок

app.use(errors());
app.use((err, req, res, next) => {
  console.log(err, '---logErr');
  const statusCode = err.statusCode || INTERNAL_SERVER_ERROR;
  const message = statusCode === INTERNAL_SERVER_ERROR ? 'На сервере произошла ошибка' : err.message;
  res.status(statusCode).send({ message });
  next();
});

app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
  });