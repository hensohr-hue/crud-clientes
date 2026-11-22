// Repository de usuários: leitura/escrita do arquivo JSON com os usuários do sistema.
const fs = require('fs/promises');
const path = require('path');

const USERS_FILE = path.resolve(__dirname, '..', '..', process.env.USERS_FILE || 'data/usuarios.json');

async function lerTodos() {
  try {
    const conteudo = await fs.readFile(USERS_FILE, 'utf-8');
    return conteudo.trim() ? JSON.parse(conteudo) : [];
  } catch (erro) {
    if (erro.code === 'ENOENT') return [];
    throw erro;
  }
}

async function salvarTodos(usuarios) {
  await fs.mkdir(path.dirname(USERS_FILE), { recursive: true });
  await fs.writeFile(USERS_FILE, JSON.stringify(usuarios, null, 2), 'utf-8');
}

async function buscarPorUsuario(usuario) {
  const usuarios = await lerTodos();
  return usuarios.find((u) => u.usuario === usuario) || null;
}

module.exports = { lerTodos, salvarTodos, buscarPorUsuario };
