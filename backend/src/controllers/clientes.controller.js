// Controller: recebe a requisição HTTP, chama o service e devolve a resposta com o status adequado.
const service = require('../services/clientes.service');

async function listar(req, res, next) {
  try {
    res.status(200).json(await service.listar());
  } catch (erro) {
    next(erro);
  }
}

async function buscar(req, res, next) {
  try {
    res.status(200).json(await service.buscar(req.params.id));
  } catch (erro) {
    next(erro);
  }
}

async function cadastrar(req, res, next) {
  try {
    const cliente = await service.cadastrar(req.body);
    res.status(201).location(`/clientes/${cliente.id}`).json(cliente);
  } catch (erro) {
    next(erro);
  }
}

async function atualizar(req, res, next) {
  try {
    res.status(200).json(await service.atualizar(req.params.id, req.body));
  } catch (erro) {
    next(erro);
  }
}

async function excluir(req, res, next) {
  try {
    await service.excluir(req.params.id);
    res.status(204).end();
  } catch (erro) {
    next(erro);
  }
}

module.exports = { listar, buscar, cadastrar, atualizar, excluir };
