// Lógica da tela de clientes: listagem, busca, estatísticas, formulário em diálogo,
// confirmação de exclusão e avisos. A comunicação com a API fica em api.js.
const $ = (id) => document.getElementById(id);

const corpoTabela = $('lista-clientes');
const tabela = $('tabela-clientes');
const areaLista = $('area-lista');
const estadoLista = $('estado-lista');
const busca = $('busca');
const contagem = $('contagem');

const dialogoCliente = $('dialogo-cliente');
const form = $('form-cliente');
const campoId = $('cliente-id');
const campos = { nome: $('nome'), email: $('email'), telefone: $('telefone') };
const btnSalvar = $('btn-salvar');
const resumoErros = $('resumo-erros');

const dialogoExcluir = $('dialogo-excluir');
const btnConfirmarExclusao = $('btn-confirmar-exclusao');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROTULOS = { nome: 'Nome', email: 'E-mail', telefone: 'Telefone' };

let clientes = [];
let clienteParaExcluir = null;
let elementoQueAbriu = null;

// ---------- utilidades ----------

function icone(nome) {
  return `<svg class="icone" aria-hidden="true"><use href="#i-${nome}"/></svg>`;
}

function iniciais(nome = '') {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return '?';
  const primeira = partes[0][0];
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return (primeira + ultima).toUpperCase();
}

function elemento(tag, classe, texto) {
  const el = document.createElement(tag);
  if (classe) el.className = classe;
  if (texto !== undefined) el.textContent = texto;
  return el;
}

// ---------- avisos (toasts) ----------

function mostrarAviso(texto, tipo = 'sucesso') {
  const aviso = elemento('div', `aviso aviso-${tipo}`);
  aviso.setAttribute('role', tipo === 'erro' ? 'alert' : 'status');
  aviso.innerHTML = icone(tipo === 'erro' ? 'alert' : 'check');
  aviso.appendChild(elemento('span', '', texto));
  const fechar = elemento('button');
  fechar.type = 'button';
  fechar.setAttribute('aria-label', 'Fechar aviso');
  fechar.innerHTML = icone('x');
  aviso.appendChild(fechar);

  const remover = () => {
    aviso.classList.add('saindo');
    setTimeout(() => aviso.remove(), 160);
  };
  fechar.addEventListener('click', remover);
  setTimeout(remover, tipo === 'erro' ? 6000 : 4000);
  $('avisos').appendChild(aviso);
}

// ---------- listagem ----------

function mostrarEsqueleto() {
  areaLista.setAttribute('aria-busy', 'true');
  estadoLista.classList.add('oculto');
  tabela.classList.remove('oculto');
  corpoTabela.innerHTML = '';
  for (let i = 0; i < 3; i += 1) {
    const tr = elemento('tr', 'esqueleto-linha');
    ['col-cliente', 'col-email', 'col-telefone'].forEach((classe, j) => {
      const td = elemento('td', classe);
      const barra = elemento('span', 'esqueleto');
      barra.style.width = ['60%', '75%', '45%'][j];
      td.appendChild(barra);
      tr.appendChild(td);
    });
    tr.appendChild(elemento('td', 'col-acoes'));
    corpoTabela.appendChild(tr);
  }
}

function mostrarEstado({ iconeNome, titulo, texto, acao, aoClicar, perigo = false }) {
  tabela.classList.add('oculto');
  estadoLista.classList.remove('oculto');
  const caixaIcone = $('estado-icone');
  caixaIcone.className = `estado-icone${perigo ? ' estado-icone-perigo' : ''}`;
  caixaIcone.innerHTML = icone(iconeNome);
  $('estado-titulo').textContent = titulo;
  $('estado-texto').textContent = texto;
  const botao = $('estado-acao');
  botao.classList.toggle('oculto', !acao);
  botao.textContent = acao || '';
  botao.onclick = aoClicar || null;
}

function atualizarEstatisticas() {
  const agora = new Date();
  const doMes = clientes.filter((c) => {
    const data = c.criadoEm ? new Date(c.criadoEm) : null;
    return data && data.getMonth() === agora.getMonth() && data.getFullYear() === agora.getFullYear();
  });
  $('est-total').textContent = clientes.length;
  $('est-telefone').textContent = clientes.filter((c) => c.telefone).length;
  $('est-mes').textContent = doMes.length;
}

function criarLinha(cliente) {
  const tr = elemento('tr');

  const tdCliente = elemento('td', 'col-cliente');
  const caixa = elemento('div', 'cliente');
  const avatar = elemento('span', 'avatar', iniciais(cliente.nome));
  avatar.setAttribute('aria-hidden', 'true');
  caixa.append(avatar, elemento('span', 'cliente-nome', cliente.nome));
  tdCliente.appendChild(caixa);

  const tdEmail = elemento('td', 'col-email');
  const email = elemento('span', 'info-contato');
  email.innerHTML = icone('mail');
  email.appendChild(elemento('span', '', cliente.email));
  tdEmail.appendChild(email);

  const tdTelefone = elemento('td', 'col-telefone');
  const telefone = elemento('span', `info-contato${cliente.telefone ? '' : ' sem-dado'}`);
  telefone.innerHTML = icone('phone');
  telefone.appendChild(elemento('span', '', cliente.telefone || 'Sem telefone'));
  tdTelefone.appendChild(telefone);

  const tdAcoes = elemento('td', 'col-acoes');
  const editar = elemento('button', 'btn-icone editar');
  editar.type = 'button';
  editar.setAttribute('aria-label', `Editar ${cliente.nome}`);
  editar.innerHTML = icone('pencil');
  editar.addEventListener('click', () => abrirEdicao(cliente.id, editar));
  const excluir = elemento('button', 'btn-icone excluir');
  excluir.type = 'button';
  excluir.setAttribute('aria-label', `Excluir ${cliente.nome}`);
  excluir.innerHTML = icone('trash');
  excluir.addEventListener('click', () => pedirExclusao(cliente, excluir));
  tdAcoes.append(editar, excluir);

  tr.append(tdCliente, tdEmail, tdTelefone, tdAcoes);
  return tr;
}

function renderizarLista() {
  const termo = busca.value.trim().toLowerCase();
  const filtrados = clientes.filter(
    (c) => c.nome.toLowerCase().includes(termo) || c.email.toLowerCase().includes(termo)
  );

  areaLista.setAttribute('aria-busy', 'false');
  corpoTabela.innerHTML = '';
  atualizarEstatisticas();

  if (!clientes.length) {
    contagem.textContent = '';
    mostrarEstado({
      iconeNome: 'users',
      titulo: 'Nenhum cliente cadastrado',
      texto: 'Comece cadastrando o primeiro cliente da empresa.',
      acao: 'Cadastrar cliente',
      aoClicar: (e) => abrirCadastro(e.currentTarget),
    });
    return;
  }

  if (!filtrados.length) {
    contagem.textContent = 'Nenhum cliente encontrado.';
    mostrarEstado({
      iconeNome: 'search',
      titulo: 'Nenhum resultado',
      texto: `Não há clientes com "${busca.value.trim()}" no nome ou e-mail.`,
      acao: 'Limpar busca',
      aoClicar: () => { busca.value = ''; renderizarLista(); busca.focus(); },
    });
    return;
  }

  estadoLista.classList.add('oculto');
  tabela.classList.remove('oculto');
  contagem.textContent = termo
    ? `${filtrados.length} de ${clientes.length} clientes encontrados`
    : `${clientes.length} ${clientes.length === 1 ? 'cliente' : 'clientes'}`;
  filtrados.forEach((c) => corpoTabela.appendChild(criarLinha(c)));
}

async function carregarClientes({ comEsqueleto = false } = {}) {
  if (comEsqueleto) mostrarEsqueleto();
  try {
    clientes = await api.listar();
    renderizarLista();
  } catch (erro) {
    if (erro.status === 401) return;
    areaLista.setAttribute('aria-busy', 'false');
    contagem.textContent = '';
    mostrarEstado({
      iconeNome: 'alert',
      titulo: 'Não foi possível carregar os clientes',
      texto: erro.message,
      acao: 'Tentar novamente',
      aoClicar: () => carregarClientes({ comEsqueleto: true }),
      perigo: true,
    });
    mostrarAviso(erro.message, 'erro');
  }
}

// ---------- formulário ----------

function validarCampo(nome) {
  const valor = campos[nome].value.trim();
  let mensagem = '';
  if (nome === 'nome') {
    if (!valor) mensagem = 'Informe o nome do cliente.';
    else if (valor.length < 3) mensagem = 'O nome deve ter pelo menos 3 caracteres.';
  }
  if (nome === 'email') {
    if (!valor) mensagem = 'Informe o e-mail do cliente.';
    else if (!EMAIL_REGEX.test(valor)) mensagem = 'Informe um e-mail válido, como nome@empresa.com.';
  }
  if (nome === 'telefone' && valor && valor.replace(/\D/g, '').length < 10) {
    mensagem = 'Telefone incompleto: informe DDD e número.';
  }
  definirErro(nome, mensagem);
  return mensagem;
}

function definirErro(nome, mensagem) {
  $(`erro-${nome}`).textContent = mensagem;
  if (mensagem) campos[nome].setAttribute('aria-invalid', 'true');
  else campos[nome].removeAttribute('aria-invalid');
}

function limparErros() {
  Object.keys(campos).forEach((nome) => definirErro(nome, ''));
  resumoErros.classList.add('oculto');
}

function mostrarResumoErros(erros) {
  const lista = $('resumo-lista');
  lista.innerHTML = '';
  erros.forEach(({ campo, mensagem }) => {
    const li = elemento('li');
    if (campo) {
      const link = elemento('a', '', `${ROTULOS[campo]}: ${mensagem}`);
      link.href = `#${campo}`;
      link.addEventListener('click', (e) => { e.preventDefault(); campos[campo].focus(); });
      li.appendChild(link);
    } else {
      li.textContent = mensagem;
    }
    lista.appendChild(li);
  });
  resumoErros.classList.remove('oculto');
  resumoErros.focus();
}

function abrirDialogo(dialogo, origem) {
  elementoQueAbriu = origem || document.activeElement;
  dialogo.showModal();
}

function fecharDialogo(dialogo) {
  dialogo.close();
}

[dialogoCliente, dialogoExcluir].forEach((dialogo) => {
  // Devolve o foco ao botão que abriu o diálogo (Esc, Cancelar ou após salvar).
  dialogo.addEventListener('close', () => {
    if (elementoQueAbriu && document.contains(elementoQueAbriu)) elementoQueAbriu.focus();
    else $('btn-novo').focus();
  });
  // Clique fora do conteúdo fecha o diálogo.
  dialogo.addEventListener('click', (e) => { if (e.target === dialogo) fecharDialogo(dialogo); });
});

function prepararFormulario(cliente) {
  form.reset();
  limparErros();
  campoId.value = cliente ? cliente.id : '';
  campos.nome.value = cliente ? cliente.nome : '';
  campos.email.value = cliente ? cliente.email : '';
  campos.telefone.value = cliente ? cliente.telefone || '' : '';
  $('titulo-form').textContent = cliente ? 'Editar cliente' : 'Novo cliente';
  btnSalvar.textContent = cliente ? 'Salvar alterações' : 'Cadastrar';
}

function abrirCadastro(origem) {
  prepararFormulario(null);
  abrirDialogo(dialogoCliente, origem);
  campos.nome.focus();
}

async function abrirEdicao(id, origem) {
  try {
    const cliente = await api.buscar(id);
    prepararFormulario(cliente);
    abrirDialogo(dialogoCliente, origem);
    campos.nome.focus();
  } catch (erro) {
    if (erro.status === 401) return;
    mostrarAviso(erro.message, 'erro');
    if (erro.status === 404) carregarClientes();
  }
}

Object.keys(campos).forEach((nome) => {
  // Validação ao sair do campo; após um erro, revalida enquanto o usuário corrige.
  campos[nome].addEventListener('blur', () => { if (campos[nome].value.trim() || nome !== 'telefone') validarCampo(nome); });
  campos[nome].addEventListener('input', () => { if (campos[nome].getAttribute('aria-invalid')) validarCampo(nome); });
});

// Máscara de telefone: (44) 99999-9999
campos.telefone.addEventListener('input', () => {
  const d = campos.telefone.value.replace(/\D/g, '').slice(0, 11);
  let formatado = d;
  if (d.length > 2) formatado = `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length > 6) formatado = `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}`;
  campos.telefone.value = formatado;
});

form.addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const erros = Object.keys(campos)
    .map((campo) => ({ campo, mensagem: validarCampo(campo) }))
    .filter((e) => e.mensagem);
  if (erros.length) {
    mostrarResumoErros(erros);
    return;
  }
  resumoErros.classList.add('oculto');

  const dados = {
    nome: campos.nome.value.trim(),
    email: campos.email.value.trim(),
    telefone: campos.telefone.value.trim(),
  };
  const id = campoId.value;
  const textoOriginal = btnSalvar.textContent;
  btnSalvar.disabled = true;
  btnSalvar.textContent = 'Salvando...';

  try {
    if (id) await api.atualizar(id, dados);
    else await api.cadastrar(dados);
    fecharDialogo(dialogoCliente);
    mostrarAviso(id ? 'Cliente atualizado com sucesso.' : 'Cliente cadastrado com sucesso.');
    carregarClientes();
  } catch (erro) {
    if (erro.status === 401) return;
    if (erro.status === 409) {
      definirErro('email', erro.message);
      mostrarResumoErros([{ campo: 'email', mensagem: erro.message }]);
    } else if (erro.status === 404) {
      fecharDialogo(dialogoCliente);
      mostrarAviso(erro.message, 'erro');
      carregarClientes();
    } else {
      const detalhes = erro.erros && erro.erros.length ? erro.erros : [erro.message];
      mostrarResumoErros(detalhes.map((mensagem) => ({ mensagem })));
    }
  } finally {
    btnSalvar.disabled = false;
    btnSalvar.textContent = textoOriginal;
  }
});

$('btn-cancelar').addEventListener('click', () => fecharDialogo(dialogoCliente));
$('btn-fechar').addEventListener('click', () => fecharDialogo(dialogoCliente));
$('btn-novo').addEventListener('click', (e) => abrirCadastro(e.currentTarget));

// ---------- exclusão ----------

function pedirExclusao(cliente, origem) {
  clienteParaExcluir = cliente;
  $('texto-excluir').textContent = `O cliente "${cliente.nome}" será removido permanentemente. Esta ação não pode ser desfeita.`;
  abrirDialogo(dialogoExcluir, origem);
  $('btn-cancelar-exclusao').focus(); // foco na opção segura
}

btnConfirmarExclusao.addEventListener('click', async () => {
  if (!clienteParaExcluir) return;
  btnConfirmarExclusao.disabled = true;
  try {
    await api.excluir(clienteParaExcluir.id);
    elementoQueAbriu = $('btn-novo'); // a linha some; o foco vai para um elemento estável
    fecharDialogo(dialogoExcluir);
    mostrarAviso('Cliente excluído com sucesso.');
  } catch (erro) {
    if (erro.status === 401) return;
    fecharDialogo(dialogoExcluir);
    mostrarAviso(erro.message, 'erro');
  } finally {
    btnConfirmarExclusao.disabled = false;
    clienteParaExcluir = null;
    carregarClientes();
  }
});

$('btn-cancelar-exclusao').addEventListener('click', () => fecharDialogo(dialogoExcluir));

// ---------- sessão ----------

busca.addEventListener('input', renderizarLista);

$('btn-sair').addEventListener('click', async () => {
  if (!modoSimulado) await auth.logout().catch(() => {});
  irParaLogin();
});

// Sem sessão, o sistema não abre: redireciona para a tela de login.
const usuarioLogado = modoSimulado ? { nome: 'Modo simulado' } : sessao.obter()?.usuario;
if (!usuarioLogado) {
  irParaLogin();
} else {
  $('nome-usuario').textContent = usuarioLogado.nome;
  $('avatar-usuario').textContent = iniciais(usuarioLogado.nome);
  carregarClientes({ comEsqueleto: true });
}
