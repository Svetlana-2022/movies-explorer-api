const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const HTTPError = require('../errors/HTTPError');
const BadRequestError = require('../errors/BedRequestError');
const NotFoundError = require('../errors/NotFoundError');
const ServerError = require('../errors/ServerError');
const ConflictError = require('../errors/ConflictError');
const UnauthorizedError = require('../errors/UnauthorizedError');
const User = require('../models/user');

const CREATED = 201;
const UniqueErrorCode = 11000;

module.exports.getUserMe = (req, res, next) => {
    const id = req.user._id;
    const { name, email } = req.body;
    User.findById(id)
      .then((user) => {
        console.log(user, '---getUser');
        if (!user) {
          throw new NotFoundError('Пользователь не найден');
        } else {
          res.send({ name, email });
        }
      })
      .catch(next);
};

module.exports.updateUserMe = (req, res, next) => {
    const { name, email } = req.body;
    console.log(req.user);
    User.findByIdAndUpdate(req.user._id, { name, email }, {
      new: true,
      runValidators: true,
    })
      .then((user) => {
        if (!user) {
          throw new NotFoundError('Пользователь не найден');
        } else {
          res.send({ data: user });
        }
      })
      .catch((err) => {
        if (err instanceof HTTPError) {
          next(err);
        } else if (err.name === 'CastError' || err.name === 'ValidationError') {
          next(new BadRequestError('Некорректные данные пользователя.'));
        } else {
          next(new ServerError('Произошла ошибка'));
        }
      });
};

module.exports.createUser = (req, res, next) => {
  console.log(req.body, '---createUser');
  bcrypt.hash(req.body.password, 10)
    .then((hash) => User.create({
      name: req.body.name,
      email: req.body.email,
      password: hash,
    }))
    .then((document) => {
      const user = document.toObject();
      delete user.password;
      res.status(CREATED).send(user);
      console.log(user, '---doc');
    })
    .catch((err) => {
      console.log(err, '---createErr');
      if (err instanceof HTTPError) {
        next(err);
      } else if (err.code === UniqueErrorCode) {
        next(new ConflictError('Пользователь с такой почтой уже существует.'));
      } else if (err.name === 'ValidationError') {
        next(new BadRequestError('Некорректные данные пользователя.'));
      } else {
        next(new ServerError('Произошла ошибка'));
      }
    });
};

module.exports.login = (req, res, next) => {
  const { name, email, password } = req.body;
  return User.findUserByCredentials({ name, email, password })
    .then((user) => {
      console.log(user, '--logUs');
      const { JWT_SECRET } = req.app.get('config');
      const token = jwt.sign({ _id: user._id }, JWT_SECRET, { expiresIn: '7d' });
      res.send({ token });
      console.log({ token }, '---logToken');
    })
    .catch((err) => {
      if (err instanceof HTTPError) {
        next(err);
      } else {
        next(new UnauthorizedError('Невалидный пароль'));
      }
    });
};


