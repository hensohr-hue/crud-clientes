// Controller de autenticação: login, logout e dados do usuário logado.
const service = require('../services/auth.service');

async function login(req, res, next) {
  try {
    res.status(200).json(await service.login(req.body));
  } catch (erro) {
    next(erro);
  }
}

function logout(req, res) {
  service.logout(req.token);
  res.status(204).end();
}

function eu(req, res) {
  res.status(200).json(req.usuario);
}

module.exports = { login, logout, eu };
