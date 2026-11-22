// Configuração do Express: middlewares, rotas, arquivos estáticos e tratamento de erros.
const path = require('path');
const express = require('express');
const cors = require('cors');
const clientesRoutes = require('./routes/clientes.routes');
const authRoutes = require('./routes/auth.routes');
const { autenticar } = require('./middlewares/autenticar');
const { ErroNegocio } = require('./services/clientes.service');

const app = express();

app.use(cors());
app.use(express.json());

// Log simples de cada requisição (exemplo de middleware no pipeline).
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'test') console.log(`${new Date().toLocaleTimeString('pt-BR')} ${req.method} ${req.originalUrl}`);
  next();
});

app.use('/auth', authRoutes);
// Todas as rotas de clientes exigem login.
app.use('/clientes', autenticar, clientesRoutes);

// Serve o front-end para que tudo funcione em http://localhost:PORT
app.use(express.static(path.resolve(__dirname, '..', '..', 'frontend')));

app.use((req, res) => {
  res.status(404).json({ mensagem: 'Rota não encontrada.' });
});

// eslint-disable-next-line no-unused-vars
app.use((erro, req, res, next) => {
  if (erro instanceof ErroNegocio) {
    return res.status(erro.status).json({ mensagem: erro.message, erros: erro.detalhes });
  }
  if (erro.type === 'entity.parse.failed') {
    return res.status(400).json({ mensagem: 'O corpo da requisição não é um JSON válido.' });
  }
  console.error(erro);
  res.status(500).json({ mensagem: 'Erro interno no servidor.' });
});

module.exports = app;
