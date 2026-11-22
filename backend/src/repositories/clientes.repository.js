// Repository: única camada que sabe onde e como os dados são guardados (arquivo JSON).
const fs = require('fs/promises');
const path = require('path');

const DATA_FILE = path.resolve(__dirname, '..', '..', process.env.DATA_FILE || 'data/clientes.json');
// Clientes fictícios usados na primeira execução (o clientes.json real não vai para o Git).
const EXEMPLO_FILE = path.resolve(__dirname, '..', '..', 'data/clientes.exemplo.json');

async function lerTodos() {
  try {
    const conteudo = await fs.readFile(DATA_FILE, 'utf-8');
    return conteudo.trim() ? JSON.parse(conteudo) : [];
  } catch (erro) {
    if (erro.code !== 'ENOENT') throw erro;
    try {
      const exemplo = JSON.parse(await fs.readFile(EXEMPLO_FILE, 'utf-8'));
      await salvarTodos(exemplo);
      return exemplo;
    } catch {
      return [];
    }
  }
}

async function salvarTodos(clientes) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(clientes, null, 2), 'utf-8');
}

async function buscarPorId(id) {
  const clientes = await lerTodos();
  return clientes.find((c) => c.id === id) || null;
}

async function criar(dados) {
  const clientes = await lerTodos();
  const proximoId = clientes.reduce((maior, c) => Math.max(maior, c.id), 0) + 1;
  const agora = new Date().toISOString();
  const novo = { id: proximoId, ...dados, criadoEm: agora, atualizadoEm: agora };
  clientes.push(novo);
  await salvarTodos(clientes);
  return novo;
}

async function atualizar(id, dados) {
  const clientes = await lerTodos();
  const indice = clientes.findIndex((c) => c.id === id);
  if (indice === -1) return null;
  clientes[indice] = { ...clientes[indice], ...dados, atualizadoEm: new Date().toISOString() };
  await salvarTodos(clientes);
  return clientes[indice];
}

async function remover(id) {
  const clientes = await lerTodos();
  const restantes = clientes.filter((c) => c.id !== id);
  if (restantes.length === clientes.length) return false;
  await salvarTodos(restantes);
  return true;
}

module.exports = { lerTodos, buscarPorId, criar, atualizar, remover };
