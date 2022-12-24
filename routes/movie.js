const router = require('express').Router();

const { getMovie, createMovie, deleteMovie } = require('../controllers/movie');
const { celebrateMovies, celebrateParamsMovies } = require('../validators/users');

router.get('/movies', getMovie);

router.post('/movies', celebrateMovies, createMovie);

router.delete('/movies/:_id', celebrateParamsMovies, deleteMovie);

module.exports = router;