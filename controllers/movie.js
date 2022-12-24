const Movie = require('../models/movie');
const HTTPError = require('../errors/HTTPError');
const BadRequestError = require('../errors/BedRequestError');
const NotFoundError = require('../errors/NotFoundError');
const ServerError = require('../errors/ServerError');
const ForbiddenError = require('../errors/Forbidden');

module.exports.getMovie = (req, res, next) => {
    Movie.find({})
      .then((movies) => res.send({ data: movies }))
      .catch((err) => {
        next(err);
      });
};

module.exports.createMovie = (req, res, next) => {
    req.body.owner = req.user._id;
    console.log(req.body);
    Movie.create(req.body)
      .then((movie) => {
        console.log(movie, '---movie');//ПРОБЛЕМА
        res.send({ data: movie });
      })
      .catch((err) => {
        console.log(err, '---err');
        if (err instanceof HTTPError) {
          next(err);
        } else if (err.name === 'ValidationError') {
          next(new BadRequestError('Некорректные данные фильма.'));
        } else {
          next(new ServerError('Произошла ошибка'));
        }
      });
  };

module.exports.deleteMovie = (req, res, next) => {
    const { _id } = req.params;
    console.log(_id, '---id');
    Movie.findById(_id)
      .then((movie) => {
        console.log(movie, '---delete');
        if (!movie) {
          throw new NotFoundError('Фильм с указанным _id не найден');
        } else if (movie.owner.toString() !== req.user._id) {
          throw new ForbiddenError('Запрещено');
        } else {
          movie.remove()
            .then(() => res.send({ data: movie }))
            .catch(next);
        }
      })
      .catch((err) => {
        console.log(err, '---errDelete')
        if (err instanceof HTTPError) {
          next(err);
        } else if (err.name === 'CastError') {
          next(new BadRequestError('Некорректные данные фильма.'));
        } else {
          next(new ServerError('Произошла ошибка'));
        }
      });
  };
