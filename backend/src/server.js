// Ponto de entrada: carrega as variáveis de ambiente e inicia o servidor HTTP.
require('dotenv').config();
const app = require('./app');
const { garantirUsuarioPadrao } = require('./services/auth.service');

const PORT = process.env.PORT || 3001;

const servidor = app.listen(PORT, async () => {
  console.log(`API de clientes rodando em http://localhost:${PORT}`);
  console.log(`Abra http://localhost:${PORT} no navegador para usar o sistema.`);
  const criado = await garantirUsuarioPadrao().catch((erro) => console.error(erro.message));
  if (criado) console.log('Usuário inicial criado: admin / admin123 (troque com "npm run criar-usuario").');
});

servidor.on('error', (erro) => {
  if (erro.code === 'EADDRINUSE') {
    console.error(`\nA porta ${PORT} já está sendo usada por outro programa.`);
    console.error('Feche o outro programa ou defina outra porta no arquivo backend/.env, por exemplo: PORT=3001\n');
    process.exit(1);
  }
  throw erro;
});
