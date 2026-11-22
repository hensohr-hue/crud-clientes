// Service de autenticação: hash de senha, login, sessões por token e logout.
const crypto = require('crypto');
const { promisify } = require('util');
const repository = require('../repositories/usuarios.repository');
const { ErroNegocio } = require('./clientes.service');

const scrypt = promisify(crypto.scrypt);
const DURACAO_SESSAO_MS = 8 * 60 * 60 * 1000; // 8 horas

// Sessões ativas em memória: token -> { usuario, nome, expiraEm }
const sessoes = new Map();

// A senha nunca é guardada em texto: salva-se "scrypt$salt$hash".
async function gerarHash(senha) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = await scrypt(senha, salt, 64);
  return `scrypt$${salt}$${hash.toString('hex')}`;
}

async function conferirSenha(senha, armazenado) {
  const [, salt, hashHex] = String(armazenado).split('$');
  if (!salt || !hashHex) return false;
  const esperado = Buffer.from(hashHex, 'hex');
  const calculado = await scrypt(senha, salt, esperado.length);
  return crypto.timingSafeEqual(esperado, calculado);
}

async function login(dados = {}) {
  const usuario = String(dados.usuario ?? '').trim().toLowerCase();
  const senha = String(dados.senha ?? '');
  const erros = [];
  if (!usuario) erros.push('O usuário é obrigatório.');
  if (!senha) erros.push('A senha é obrigatória.');
  if (erros.length) throw new ErroNegocio(400, 'Dados inválidos.', erros);

  const registro = await repository.buscarPorUsuario(usuario);
  // Mesma mensagem para usuário inexistente ou senha errada, para não revelar quais usuários existem.
  if (!registro || !(await conferirSenha(senha, registro.senhaHash))) {
    throw new ErroNegocio(401, 'Usuário ou senha incorretos.');
  }

  const token = crypto.randomBytes(32).toString('hex');
  sessoes.set(token, { usuario: registro.usuario, nome: registro.nome, expiraEm: Date.now() + DURACAO_SESSAO_MS });
  return { token, usuario: { usuario: registro.usuario, nome: registro.nome } };
}

function validarToken(token) {
  const sessao = token && sessoes.get(token);
  if (!sessao) return null;
  if (sessao.expiraEm < Date.now()) {
    sessoes.delete(token);
    return null;
  }
  return { usuario: sessao.usuario, nome: sessao.nome };
}

function logout(token) {
  sessoes.delete(token);
}

async function criarUsuario({ usuario, nome, senha }) {
  usuario = String(usuario ?? '').trim().toLowerCase();
  if (!usuario || !senha) throw new ErroNegocio(400, 'Informe usuário e senha.');
  if (String(senha).length < 6) throw new ErroNegocio(400, 'A senha deve ter pelo menos 6 caracteres.');
  const usuarios = await repository.lerTodos();
  const novo = { usuario, nome: nome || usuario, senhaHash: await gerarHash(String(senha)) };
  const indice = usuarios.findIndex((u) => u.usuario === usuario);
  if (indice === -1) usuarios.push(novo);
  else usuarios[indice] = novo;
  await repository.salvarTodos(usuarios);
  return { usuario: novo.usuario, nome: novo.nome, atualizado: indice !== -1 };
}

// Na primeira execução (sem usuários cadastrados), cria o usuário de demonstração.
async function garantirUsuarioPadrao() {
  const usuarios = await repository.lerTodos();
  if (usuarios.length) return null;
  return criarUsuario({ usuario: 'admin', senha: 'admin123', nome: 'Administrador' });
}

module.exports = { login, logout, validarToken, criarUsuario, garantirUsuarioPadrao, gerarHash };
