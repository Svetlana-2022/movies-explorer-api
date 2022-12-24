const router = require('express').Router();

const { getUserMe, updateUserMe } = require('../controllers/user');
const { celebrateUserMe } = require('../validators/users');

router.get('/users/me', getUserMe);

router.patch('/users/me', celebrateUserMe, updateUserMe);

module.exports = router;