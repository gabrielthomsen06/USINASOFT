const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Servir Bootstrap do node_modules
app.use('/node_modules/bootstrap', express.static('node_modules/bootstrap'));

// Configuração de sessão
app.use(session({
  secret: 'usinasoft-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false,
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

// Middleware de autenticação
const requireAuth = (req, res, next) => {
  if (req.session.user || req.path === '/login' || req.path === '/cadastro-usuario') {
    next();
  } else {
    res.redirect('/login');
  }
  
};

// ===== ROTAS DE AUTENTICAÇÃO =====
app.get('/login', (req, res) => {
  res.render('login', { 
    title: 'Login - UsinaSoft',
    error: req.query.error
  });
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  // Simulação de autenticação (substituir por lógica real)
  if (email && password) {
    req.session.user = { 
      email, 
      name: 'Usuário',
      id: 1,
      role: 'admin'
    };
    res.redirect('/menu');
  } else {
    res.render('login', { 
      title: 'Login - UsinaSoft',
      error: 'Email e senha são obrigatórios'
    });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Erro ao destruir sessão:', err);
    }
    res.redirect('/login');
  });
});

// ===== ROTAS DE CADASTRO DE USUÁRIO =====
app.get('/cadastro-usuario', (req, res) => {
  res.render('cadastro-usuario', { 
    title: 'Cadastro de Usuário - UsinaSoft',
    error: req.query.error,
    success: req.query.success
  });
});

app.post('/cadastro-usuario', (req, res) => {
  const { nome, email, senha, confirmarSenha, telefone, cargo, empresa, aceitarTermos } = req.body;
  
  // Validações básicas
  if (!nome || !email || !senha || !confirmarSenha || !cargo) {
    return res.render('cadastro-usuario', {
      title: 'Cadastro de Usuário - UsinaSoft',
      error: 'Todos os campos obrigatórios devem ser preenchidos'
    });
  }
  
  if (senha !== confirmarSenha) {
    return res.render('cadastro-usuario', {
      title: 'Cadastro de Usuário - UsinaSoft',
      error: 'As senhas não coincidem'
    });
  }
  
  if (senha.length < 6) {
    return res.render('cadastro-usuario', {
      title: 'Cadastro de Usuário - UsinaSoft',
      error: 'A senha deve ter pelo menos 6 caracteres'
    });
  }
  
  if (!aceitarTermos) {
    return res.render('cadastro-usuario', {
      title: 'Cadastro de Usuário - UsinaSoft',
      error: 'Você deve aceitar os termos de uso'
    });
  }
  
  // Aqui você salvaria no banco de dados
  console.log('Novo usuário cadastrado:', {
    nome,
    email,
    senha: '***', // Nunca logar a senha real
    telefone,
    cargo,
    empresa,
    dataCadastro: new Date(),
    ativo: true
  });
  
  // Simular sucesso no cadastro
  res.redirect('/login?success=Conta criada com sucesso! Faça login para acessar o sistema.');
});

// ===== ROTAS PRINCIPAIS =====
app.get('/menu', requireAuth, (req, res) => {
  res.render('menu', { 
    title: 'Menu Principal - UsinaSoft',
    user: req.session.user,
    showHeader: true,
    showNav: true,
    showFooter: true,
    currentPage: 'menu'
  });
});

app.get('/cadastro', requireAuth, (req, res) => {
  const success = req.query.success === 'true';
  
  res.render('cadastro', { 
    title: 'Cadastro de Peças - UsinaSoft',
    user: req.session.user,
    showHeader: true,
    showNav: true,
    showFooter: true,
    currentPage: 'cadastro',
    success
  });
});

app.post('/cadastro', requireAuth, (req, res) => {
  const { cliente, numeroPedido, codigoPeca, quantidade, dataEntrega, prioridade, observacoes } = req.body;
  
  // Validação básica
  if (!cliente || !numeroPedido || !codigoPeca || !quantidade || !dataEntrega) {
    return res.render('cadastro', {
      title: 'Cadastro de Peças - UsinaSoft',
      user: req.session.user,
      showHeader: true,
      showNav: true,
      showFooter: true,
      currentPage: 'cadastro',
      error: 'Todos os campos obrigatórios devem ser preenchidos'
    });
  }
  
  // Aqui você salvaria no banco de dados
  console.log('Nova peça cadastrada:', {
    cliente,
    numeroPedido,
    codigoPeca,
    quantidade: parseInt(quantidade),
    dataEntrega,
    prioridade,
    observacoes,
    dataCadastro: new Date(),
    usuario: req.session.user.email
  });
  
  res.redirect('/cadastro?success=true');
});

app.get('/atividades', requireAuth, (req, res) => {
  // Dados mockados para o kanban
  const atividades = {
    fila: [
      { id: 1, codigo: 'GA-001', nome: 'Montagem de Engrenagem', dataEntrega: '15/11/2023' },
      { id: 2, codigo: 'CB-002', nome: 'Placa de Circuito', dataEntrega: '20/11/2023' },
      { id: 5, codigo: 'BR-005', nome: 'Bucha de Rolamento', dataEntrega: '30/11/2023' }
    ],
    andamento: [
      { id: 3, codigo: 'MF-003', nome: 'Estrutura da Máquina', dataEntrega: '25/11/2023' },
      { id: 6, codigo: 'PN-006', nome: 'Pino de Fixação', dataEntrega: '28/11/2023' }
    ],
    concluido: [
      { id: 4, codigo: 'AX-004', nome: 'Eixo Principal', dataEntrega: '10/11/2023' },
      { id: 7, codigo: 'FL-007', nome: 'Flange de Conexão', dataEntrega: '05/11/2023' }
    ]
  };

  res.render('atividades', { 
    title: 'Controle de Atividades - UsinaSoft',
    user: req.session.user,
    showHeader: true,
    showNav: true,
    showFooter: true,
    currentPage: 'atividades',
    atividades
  });
});

app.get('/producao', requireAuth, (req, res) => {
  // Dados mockados para produção
  const producao = [
    { id: 1, nome: 'Montagem de engrenagem', codigo: 'GA-001', status: 'andamento', dataEntrega: '15/11/2023' },
    { id: 2, nome: 'Placa de Circuito', codigo: 'CB-002', status: 'concluido', dataEntrega: '10/10/2023' },
    { id: 3, nome: 'Estrutura da máquina', codigo: 'MF-003', status: 'andamento', dataEntrega: '20/12/2023' },
    { id: 4, nome: 'Bucha de Rolamento', codigo: 'BR-005', status: 'fila', dataEntrega: '30/11/2023' },
    { id: 5, nome: 'Pino de Fixação', codigo: 'PN-006', status: 'concluido', dataEntrega: '28/11/2023' }
  ];

  res.render('producao', { 
    title: 'Controle de Produção - UsinaSoft',
    user: req.session.user,
    showHeader: true,
    showNav: true,
    showFooter: true,
    currentPage: 'producao',
    producao
  });
});

app.get('/indicadores', requireAuth, (req, res) => {
  // Dados mockados para indicadores
  const indicadores = {
    emFila: 32,
    emAndamento: 45,
    concluidas: 120
  };

  res.render('indicadores', { 
    title: 'Indicadores - UsinaSoft',
    user: req.session.user,
    showHeader: true,
    showNav: true,
    showFooter: true,
    currentPage: 'indicadores',
    indicadores
  });
});

// Rota raiz redireciona para login
app.get('/', (req, res) => {
  res.redirect('/login');
});

app.listen(PORT, () => {
  console.log(`UsinaSoft rodando na porta ${PORT}`);
  console.log(`Acesse: http://localhost:${PORT}`);
});
