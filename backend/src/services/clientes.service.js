// Service: regras de negócio e validações. Não conhece HTTP nem o formato de armazenamento.
const repository = require('../repositories/clientes.repository');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Erro com status HTTP associado, tratado pelo controller.
class ErroNegocio extends Error {
  constructor(status, mensagem, detalhes) {
    super(mensagem);
    this.status = status;
    this.detalhes = detalhes;
  }
}

function normalizar(dados = {}) {
  return {
    nome: String(dados.nome ?? '').trim(),
    email: String(dados.email ?? '').trim().toLowerCase(),
    telefone: String(dados.telefone ?? '').trim(),
  };
}

function validar(cliente) {
  const erros = [];
  if (!cliente.nome) erros.push('O nome é obrigatório.');
  else if (cliente.nome.length < 3) erros.push('O nome deve ter pelo menos 3 caracteres.');
  if (!cliente.email) erros.push('O e-mail é obrigatório.');
  else if (!EMAIL_REGEX.test(cliente.email)) erros.push('O e-mail informado é inválido.');
  if (cliente.telefone && !/^[\d\s()+-]{8,20}$/.test(cliente.telefone)) {
    erros.push('O telefone deve conter apenas números, espaços, parênteses ou hífen.');
  }
  if (erros.length) throw new ErroNegocio(400, 'Dados inválidos.', erros);
}

async function garantirEmailUnico(email, idIgnorado = null) {
  const clientes = await repository.lerTodos();
  const existente = clientes.find((c) => c.email === email && c.id !== idIgnorado);
  if (existente) throw new ErroNegocio(409, 'Já existe um cliente cadastrado com este e-mail.');
}

function converterId(idTexto) {
  const id = Number(idTexto);
  if (!Number.isInteger(id) || id <= 0) throw new ErroNegocio(400, 'O id informado é inválido.');
  return id;
}

async function listar() {
  return repository.lerTodos();
}

async function buscar(idTexto) {
  const cliente = await repository.buscarPorId(converterId(idTexto));
  if (!cliente) throw new ErroNegocio(404, 'Cliente não encontrado.');
  return cliente;
}

async function cadastrar(dados) {
  const cliente = normalizar(dados);
  validar(cliente);
  await garantirEmailUnico(cliente.email);
  return repository.criar(cliente);
}

async function atualizar(idTexto, dados) {
  const id = converterId(idTexto);
  if (!(await repository.buscarPorId(id))) throw new ErroNegocio(404, 'Cliente não encontrado.');
  const cliente = normalizar(dados);
  validar(cliente);
  await garantirEmailUnico(cliente.email, id);
  return repository.atualizar(id, cliente);
}

async function excluir(idTexto) {
  const removido = await repository.remover(converterId(idTexto));
  if (!removido) throw new ErroNegocio(404, 'Cliente não encontrado.');
}

module.exports = { listar, buscar, cadastrar, atualizar, excluir, ErroNegocio };
