// Camada de comunicação com a API: concentra todas as chamadas fetch().
// Servido pelo Express (qualquer porta): a API está na mesma origem.
// Aberto como arquivo local ou pelo Live Server (portas 5500/5501): usa o servidor em localhost:3001.
const API_BASE = location.protocol === 'file:' || ['5500', '5501'].includes(location.port)
  ? 'http://localhost:3001'
  : '';

class ErroApi extends Error {
  constructor(mensagem, status, erros = []) {
    super(mensagem);
    this.status = status;
    this.erros = erros;
  }
}

// Sessão do usuário: o token recebido no login fica no sessionStorage (some ao fechar o navegador).
const sessao = {
  obter() {
    try {
      return JSON.parse(sessionStorage.getItem('sessao')) || null;
    } catch {
      return null;
    }
  },
  salvar(dados) {
    try {
      sessionStorage.setItem('sessao', JSON.stringify(dados));
    } catch {
      // armazenamento indisponível: a sessão dura só enquanto a página estiver aberta
    }
  },
  limpar() {
    try {
      sessionStorage.removeItem('sessao');
    } catch {
      // ignora
    }
  },
};

function irParaLogin() {
  sessao.limpar();
  location.href = 'login.html';
}

async function requisitar(caminho, opcoes = {}) {
  const token = sessao.obter()?.token;
  let resposta;
  try {
    resposta = await fetch(API_BASE + caminho, {
      ...opcoes,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  } catch {
    throw new ErroApi('Não foi possível conectar à API. Verifique se o servidor está em execução.', 0);
  }

  // Sessão expirada ou inválida em qualquer rota protegida: volta para o login.
  if (resposta.status === 401 && !caminho.startsWith('/auth/login')) {
    irParaLogin();
    throw new ErroApi('Sessão expirada. Faça login novamente.', 401);
  }

  if (resposta.status === 204) return null;

  const corpo = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    throw new ErroApi(corpo.mensagem || `Erro ${resposta.status} ao processar a requisição.`, resposta.status, corpo.erros);
  }
  return corpo;
}

const auth = {
  login: (usuario, senha) => requisitar('/auth/login', { method: 'POST', body: JSON.stringify({ usuario, senha }) }),
  logout: () => requisitar('/auth/logout', { method: 'POST' }),
};

const apiReal = {
  listar: () => requisitar('/clientes'),
  buscar: (id) => requisitar(`/clientes/${id}`),
  cadastrar: (cliente) => requisitar('/clientes', { method: 'POST', body: JSON.stringify(cliente) }),
  atualizar: (id, cliente) => requisitar(`/clientes/${id}`, { method: 'PUT', body: JSON.stringify(cliente) }),
  excluir: (id) => requisitar(`/clientes/${id}`, { method: 'DELETE' }),
};

// Etapa 1: dados simulados em memória para validar a interface antes da integração.
// Ative abrindo a página com ?simulado no final da URL.
function criarApiSimulada() {
  let dados = [
    { id: 1, nome: 'Cliente Exemplo', email: 'exemplo@email.com', telefone: '(44) 99999-0000' },
    { id: 2, nome: 'Fulano de Tal', email: 'fulano@email.com', telefone: '' },
  ];
  let proximoId = 3;
  const encontrar = (id) => {
    const cliente = dados.find((c) => c.id === Number(id));
    if (!cliente) throw new ErroApi('Cliente não encontrado.', 404);
    return cliente;
  };
  return {
    listar: async () => dados.map((c) => ({ ...c })),
    buscar: async (id) => ({ ...encontrar(id) }),
    cadastrar: async (cliente) => {
      const novo = { id: proximoId++, ...cliente };
      dados.push(novo);
      return novo;
    },
    atualizar: async (id, cliente) => Object.assign(encontrar(id), cliente),
    excluir: async (id) => {
      encontrar(id);
      dados = dados.filter((c) => c.id !== Number(id));
      return null;
    },
  };
}

const modoSimulado = new URLSearchParams(location.search).has('simulado');
const api = modoSimulado ? criarApiSimulada() : apiReal;
