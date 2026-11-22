// Router: associa cada método HTTP + caminho à função do controller.
const { Router } = require('express');
const controller = require('../controllers/clientes.controller');

const router = Router();

router.get('/', controller.listar);
router.get('/:id', controller.buscar);
router.post('/', controller.cadastrar);
router.put('/:id', controller.atualizar);
router.delete('/:id', controller.excluir);

module.exports = router;
