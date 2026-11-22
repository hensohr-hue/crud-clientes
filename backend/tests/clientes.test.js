// Testes de integração da API. Usam um arquivo JSON temporário para não alterar os dados reais.
const { test, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const pastaTemp = fs.mkdtempSync(path.join(os.tmpdir(), 'crud-clientes-'));
process.env.DATA_FILE = path.join(pastaTemp, 'clientes.json');
process.env.USERS_FILE = path.join(pastaTemp, 'usuarios.json');
process.env.NODE_ENV = 'test';
fs.writeFileSync(process.env.DATA_FILE, '[]');

const app = require('../src/app');
const { criarUsuario } = require('../src/services/auth.service');

let servidor;
let raiz;
let base;
let token;

before(async () => {
  await criarUsuario({ usuario: 'teste', senha: 'senha123', nome: 'Usuário de Teste' });
  servidor = app.listen(0);
  await new Promise((resolve) => servidor.once('listening', resolve));
  raiz = `http://localhost:${servidor.address().port}`;
  base = `${raiz}/clientes`;
});

after(() => {
  servidor.close();
  fs.rmSync(pastaTemp, { recursive: true, force: true });
});

// fetch já autenticado com o token obtido no login
function fetchAuth(url, opcoes = {}) {
  return fetch(url, { ...opcoes, headers: { ...opcoes.headers, Authorization: `Bearer ${token}` } });
}

function enviar(metodo, url, corpo) {
  return fetchAuth(url, {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });
}

function login(usuario, senha) {
  return fetch(`${raiz}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario, senha }),
  });
}

// ---------- autenticação ----------

test('GET /clientes sem login retorna 401', async () => {
  const resp = await fetchAuth(base);
  assert.strictEqual(resp.status, 401);
});

test('GET /clientes com token inválido retorna 401', async () => {
  const resp = await fetch(base, { headers: { Authorization: 'Bearer token-falso' } });
  assert.strictEqual(resp.status, 401);
});

test('POST /auth/login com campos vazios retorna 400', async () => {
  const resp = await login('', '');
  assert.strictEqual(resp.status, 400);
});

test('POST /auth/login com senha errada retorna 401', async () => {
  const resp = await login('teste', 'senha-errada');
  assert.strictEqual(resp.status, 401);
});

test('POST /auth/login com usuário inexistente retorna 401', async () => {
  const resp = await login('ninguem', 'senha123');
  assert.strictEqual(resp.status, 401);
});

test('POST /auth/login com credenciais corretas retorna token (200)', async () => {
  const resp = await login('Teste', 'senha123');
  assert.strictEqual(resp.status, 200);
  const corpo = await resp.json();
  assert.ok(corpo.token);
  assert.strictEqual(corpo.usuario.nome, 'Usuário de Teste');
  assert.strictEqual(corpo.usuario.senhaHash, undefined);
  token = corpo.token;
});

test('GET /auth/me retorna o usuário logado (200)', async () => {
  const resp = await fetchAuth(`${raiz}/auth/me`);
  assert.strictEqual(resp.status, 200);
  assert.strictEqual((await resp.json()).usuario, 'teste');
});

// ---------- CRUD de clientes (autenticado) ----------

let idCriado;

test('GET /clientes retorna lista vazia inicialmente (200)', async () => {
  const resp = await fetchAuth(base);
  assert.strictEqual(resp.status, 200);
  assert.deepStrictEqual(await resp.json(), []);
});

test('POST /clientes cadastra cliente válido (201)', async () => {
  const resp = await enviar('POST', base, { nome: 'Carlos Lima', email: 'Carlos@Email.com', telefone: '(44) 91234-5678' });
  assert.strictEqual(resp.status, 201);
  const cliente = await resp.json();
  assert.ok(cliente.id);
  assert.strictEqual(cliente.email, 'carlos@email.com');
  idCriado = cliente.id;
});

test('POST /clientes sem nome e e-mail retorna 400', async () => {
  const resp = await enviar('POST', base, { nome: '', email: '' });
  assert.strictEqual(resp.status, 400);
  const corpo = await resp.json();
  assert.ok(corpo.erros.includes('O nome é obrigatório.'));
  assert.ok(corpo.erros.includes('O e-mail é obrigatório.'));
});

test('POST /clientes com e-mail inválido retorna 400', async () => {
  const resp = await enviar('POST', base, { nome: 'Teste', email: 'email-invalido' });
  assert.strictEqual(resp.status, 400);
});

test('POST /clientes com e-mail duplicado retorna 409', async () => {
  const resp = await enviar('POST', base, { nome: 'Outro Carlos', email: 'carlos@email.com' });
  assert.strictEqual(resp.status, 409);
});

test('GET /clientes/:id retorna o cliente (200)', async () => {
  const resp = await fetchAuth(`${base}/${idCriado}`);
  assert.strictEqual(resp.status, 200);
  assert.strictEqual((await resp.json()).nome, 'Carlos Lima');
});

test('GET /clientes/:id inexistente retorna 404', async () => {
  const resp = await fetchAuth(`${base}/9999`);
  assert.strictEqual(resp.status, 404);
});

test('PUT /clientes/:id atualiza o cliente (200)', async () => {
  const resp = await enviar('PUT', `${base}/${idCriado}`, { nome: 'Carlos Lima Junior', email: 'carlos@email.com', telefone: '' });
  assert.strictEqual(resp.status, 200);
  assert.strictEqual((await resp.json()).nome, 'Carlos Lima Junior');
});

test('PUT /clientes/:id inexistente retorna 404', async () => {
  const resp = await enviar('PUT', `${base}/9999`, { nome: 'Ninguém', email: 'ninguem@email.com' });
  assert.strictEqual(resp.status, 404);
});

test('PUT /clientes/:id com campos vazios retorna 400', async () => {
  const resp = await enviar('PUT', `${base}/${idCriado}`, { nome: '', email: '' });
  assert.strictEqual(resp.status, 400);
});

test('DELETE /clientes/:id exclui o cliente (204)', async () => {
  const resp = await enviar('DELETE', `${base}/${idCriado}`);
  assert.strictEqual(resp.status, 204);
});

test('DELETE /clientes/:id já excluído retorna 404', async () => {
  const resp = await enviar('DELETE', `${base}/${idCriado}`);
  assert.strictEqual(resp.status, 404);
});

test('JSON malformado retorna 400', async () => {
  const resp = await fetchAuth(base, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{nome:' });
  assert.strictEqual(resp.status, 400);
});

test('POST /auth/logout encerra a sessão (204) e o token deixa de valer (401)', async () => {
  const resp = await fetchAuth(`${raiz}/auth/logout`, { method: 'POST' });
  assert.strictEqual(resp.status, 204);
  const depois = await fetchAuth(base);
  assert.strictEqual(depois.status, 401);
});
