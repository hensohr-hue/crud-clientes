// Middleware de autenticação: só deixa a requisição seguir se houver um token válido
// no cabeçalho "Authorization: Bearer <token>".
const authService = require('../services/auth.service');

function extrairToken(req) {
  const [tipo, token] = String(req.headers.authorization || '').split(' ');
  return tipo === 'Bearer' ? token : null;
}

function autenticar(req, res, next) {
  const usuario = authService.validarToken(extrairToken(req));
  if (!usuario) {
    return res.status(401).json({ mensagem: 'Sessão expirada ou não autenticada. Faça login novamente.' });
  }
  req.usuario = usuario;
  req.token = extrairToken(req);
  next();
}

module.exports = { autenticar, extrairToken };
