// Tela de login: valida os campos, envia as credenciais à API e guarda o token da sessão.
const formLogin = document.getElementById('form-login');
const campoUsuario = document.getElementById('usuario');
const campoSenha = document.getElementById('senha');
const btnEntrar = document.getElementById('btn-entrar');
const btnMostrar = document.getElementById('btn-mostrar');
const alertaErro = document.getElementById('login-erro');

// Já logado: vai direto para o sistema.
if (sessao.obter()?.token) location.href = 'index.html';

function definirErro(campo, mensagem) {
  document.getElementById(`erro-${campo.id}`).textContent = mensagem;
  if (mensagem) campo.setAttribute('aria-invalid', 'true');
  else campo.removeAttribute('aria-invalid');
}

function mostrarAlerta(mensagem) {
  document.getElementById('login-erro-texto').textContent = mensagem;
  alertaErro.classList.toggle('oculto', !mensagem);
}

function carregando(ativo) {
  btnEntrar.disabled = ativo;
  document.getElementById('spinner').classList.toggle('oculto', !ativo);
  document.getElementById('btn-entrar-texto').textContent = ativo ? 'Entrando...' : 'Entrar';
}

btnMostrar.addEventListener('click', () => {
  const mostrar = campoSenha.type === 'password';
  campoSenha.type = mostrar ? 'text' : 'password';
  btnMostrar.setAttribute('aria-pressed', String(mostrar));
  btnMostrar.setAttribute('aria-label', mostrar ? 'Ocultar senha' : 'Mostrar senha');
  document.getElementById('icone-mostrar').setAttribute('href', mostrar ? '#i-eye-off' : '#i-eye');
  campoSenha.focus();
});

[campoUsuario, campoSenha].forEach((campo) => {
  campo.addEventListener('input', () => { if (campo.value) definirErro(campo, ''); });
});

formLogin.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  mostrarAlerta('');

  const usuario = campoUsuario.value.trim();
  const senha = campoSenha.value;
  definirErro(campoUsuario, usuario ? '' : 'Informe o usuário.');
  definirErro(campoSenha, senha ? '' : 'Informe a senha.');
  if (!usuario) return campoUsuario.focus();
  if (!senha) return campoSenha.focus();

  carregando(true);
  try {
    const resposta = await auth.login(usuario, senha);
    sessao.salvar(resposta);
    location.href = 'index.html';
  } catch (erro) {
    mostrarAlerta(erro.message);
    campoSenha.value = '';
    campoSenha.focus();
    carregando(false);
  }
});
