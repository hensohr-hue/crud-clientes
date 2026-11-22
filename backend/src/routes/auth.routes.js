// Rotas de autenticação.
const { Router } = require('express');
const controller = require('../controllers/auth.controller');
const { autenticar } = require('../middlewares/autenticar');

const router = Router();

router.post('/login', controller.login);
router.post('/logout', autenticar, controller.logout);
router.get('/me', autenticar, controller.eu);

module.exports = router;
