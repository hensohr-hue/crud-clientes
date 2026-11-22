// Cria ou altera a senha de um usuário do sistema.
// Uso: npm run criar-usuario -- <usuario> <senha> ["Nome completo"]
require('dotenv').config();
const { criarUsuario } = require('../src/services/auth.service');

const [usuario, senha, nome] = process.argv.slice(2);

if (!usuario || !senha) {
  console.log('Uso: npm run criar-usuario -- <usuario> <senha> ["Nome completo"]');
  process.exit(1);
}

criarUsuario({ usuario, senha, nome })
  .then((u) => console.log(`Usuário "${u.usuario}" ${u.atualizado ? 'atualizado' : 'criado'} com sucesso.`))
  .catch((erro) => {
    console.error(erro.message);
    process.exit(1);
  });
