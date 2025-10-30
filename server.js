const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const path = require("path");
const axios = require("axios");
const { API_BASE_URL } = require("./configs");
const api = require("./configs/api");
const { title } = require("process");
const { error } = require("console");
const {
  getStatusClass,
  getStatusIcon,
  getStatusLabel,
  formatDate,
} = require("./utils/statusHelpers");

const apiBaseUrl = API_BASE_URL + "/";
const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// Servir arquivos CSS com MIME type correto
app.use(
  "/css",
  express.static(path.join(__dirname, "css"), {
    setHeaders: (res, path) => {
      if (path.endsWith(".css")) {
        res.setHeader("Content-Type", "text/css");
      }
    },
  })
);

// Servir arquivos JS com MIME type correto
app.use(
  "/js",
  express.static(path.join(__dirname, "js"), {
    setHeaders: (res, path) => {
      if (path.endsWith(".js")) {
        res.setHeader("Content-Type", "text/javascript");
      }
    },
  })
);

// Servir Bootstrap do node_modules
app.use("/node_modules/bootstrap", express.static("node_modules/bootstrap"));

// Configuração de sessão
app.use(
  session({
    secret: "usinasoft-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      maxAge: 24 * 60 * 60 * 1000, // 24 horas
    },
  })
);

// Middleware de autenticação
const requireAuth = (req, res, next) => {
  if (
    req.session.user ||
    req.path === "/login" ||
    req.path === "/cadastro-usuario"
  ) {
    next();
  } else {
    res.redirect("/login");
  }
};

// ===== ROTAS DE AUTENTICAÇÃO =====
app.get("/login", (req, res) => {
  res.render("login", {
    title: "Login - UsinaSoft",
    error: req.query.error,
  });
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  // Simulação de autenticação (substituir por lógica real)
  if (email && password) {
    req.session.user = {
      email,
      name: "Usuário",
      id: 1,
      role: "admin",
    };
    res.redirect("/menu");
  } else {
    res.render("login", {
      title: "Login - UsinaSoft",
      error: "Email e senha são obrigatórios",
    });
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Erro ao destruir sessão:", err);
    }
    res.redirect("/login");
  });
});

// ===== ROTAS DE CADASTRO DE USUÁRIO =====
app.get("/cadastro-usuario", (req, res) => {
  res.render("cadastro-usuario", {
    title: "Cadastro de Usuário - UsinaSoft",
    error: req.query.error,
    success: req.query.success,
  });
});

app.post("/cadastro-usuario", (req, res) => {
  const {
    nome,
    email,
    senha,
    confirmarSenha,
    telefone,
    cargo,
    empresa,
    aceitarTermos,
  } = req.body;

  // Validações básicas
  if (!nome || !email || !senha || !confirmarSenha || !cargo) {
    return res.render("cadastro-usuario", {
      title: "Cadastro de Usuário - UsinaSoft",
      error: "Todos os campos obrigatórios devem ser preenchidos",
    });
  }

  if (senha !== confirmarSenha) {
    return res.render("cadastro-usuario", {
      title: "Cadastro de Usuário - UsinaSoft",
      error: "As senhas não coincidem",
    });
  }

  if (senha.length < 6) {
    return res.render("cadastro-usuario", {
      title: "Cadastro de Usuário - UsinaSoft",
      error: "A senha deve ter pelo menos 6 caracteres",
    });
  }

  if (!aceitarTermos) {
    return res.render("cadastro-usuario", {
      title: "Cadastro de Usuário - UsinaSoft",
      error: "Você deve aceitar os termos de uso",
    });
  }

  // Aqui você salvaria no banco de dados
  console.log("Novo usuário cadastrado:", {
    nome,
    email,
    senha: "***", // Nunca logar a senha real
    telefone,
    cargo,
    empresa,
    dataCadastro: new Date(),
    ativo: true,
  });

  // Simular sucesso no cadastro
  res.redirect(
    "/login?success=Conta criada com sucesso! Faça login para acessar o sistema."
  );
});

// ===== ROTAS PRINCIPAIS =====
app.get("/menu", requireAuth, (req, res) => {
  res.render("menu", {
    title: "Menu Principal - UsinaSoft",
    user: req.session.user,
    showHeader: true,
    showNav: true,
    showFooter: true,
    currentPage: "menu",
  });
});

app.get("/cadastro", requireAuth, (req, res) => {
  const success = req.query.success === "true";

  res.render("cadastro", {
    title: "Cadastro de Peças - UsinaSoft",
    user: req.session.user,
    showHeader: true,
    showNav: true,
    showFooter: true,
    currentPage: "cadastro",
    success,
  });
});

app.post("/cadastro", requireAuth, (req, res) => {
  const {
    cliente,
    numeroPedido,
    codigoPeca,
    quantidade,
    dataEntrega,
    prioridade,
    observacoes,
  } = req.body;

  // Validação básica
  if (!cliente || !numeroPedido || !codigoPeca || !quantidade || !dataEntrega) {
    return res.render("cadastro", {
      title: "Cadastro de Peças - UsinaSoft",
      user: req.session.user,
      showHeader: true,
      showNav: true,
      showFooter: true,
      currentPage: "cadastro",
      error: "Todos os campos obrigatórios devem ser preenchidos",
    });
  }

  // Aqui você salvaria no banco de dados
  console.log("Nova peça cadastrada:", {
    cliente,
    numeroPedido,
    codigoPeca,
    quantidade: parseInt(quantidade),
    dataEntrega,
    prioridade,
    observacoes,
    dataCadastro: new Date(),
    usuario: req.session.user.email,
  });

  res.redirect("/cadastro?success=true");
});

app.get("/atividades", requireAuth, async (req, res) => {
  try {
    // Buscar atividades da API
    const atividadesResponse = await axios.get(`${apiBaseUrl}atividades/`);
    const usuariosResponse = await axios.get(`${apiBaseUrl}usuarios/`);

    let atividades = Array.isArray(atividadesResponse.data)
      ? atividadesResponse.data
      : atividadesResponse.data.results || [];

    const usuarios = Array.isArray(usuariosResponse.data)
      ? usuariosResponse.data
      : usuariosResponse.data.results || [];

    // Criar mapa de usuários para lookup rápido
    const usuariosMap = {};
    usuarios.forEach((u) => {
      usuariosMap[u.id] = `${u.first_name} ${u.last_name}`.trim() || u.email;
    });

    // Enriquecer dados de atividades com nomes de usuários
    atividades = atividades.map((atividade) => ({
      ...atividade,
      responsavel_nome: usuariosMap[atividade.responsavel] || "Não atribuído",
      data_inicio_formatada: atividade.data_inicio
        ? formatDate(atividade.data_inicio)
        : "N/A",
      data_fim_formatada: atividade.data_fim
        ? formatDate(atividade.data_fim)
        : "N/A",
    }));

    res.render("atividades", {
      title: "Controle de Atividades - UsinaSoft",
      user: req.session.user,
      showHeader: true,
      showNav: true,
      showFooter: true,
      currentPage: "atividades",
      atividades,
      error: null,
      getStatusClass,
      getStatusIcon,
      getStatusLabel,
      formatDate,
    });
  } catch (error) {
    res.render("atividades", {
      title: "Controle de Atividades - UsinaSoft",
      user: req.session.user,
      showHeader: true,
      showNav: true,
      showFooter: true,
      currentPage: "atividades",
      atividades: [],
      error: "Erro ao carregar atividades. Tente novamente.",
      getStatusClass,
      getStatusIcon,
      getStatusLabel,
      formatDate,
    });
  }
});

//ROTA DE PRODUCAO /producao
app.get("/producao", requireAuth, async (req, res) => {
  try {
    // Fetch production orders
    const opsResponse = await api.get("/ops/");
    const producaoData = opsResponse.data;

    // Ensure producao is an array - handle both array and object responses
    let producao = Array.isArray(producaoData)
      ? producaoData
      : producaoData.results || [];

    // Try to fetch user data to enrich the production orders
    try {
      const usuariosResponse = await api.get("/usuarios/");
      const usuariosData = Array.isArray(usuariosResponse.data)
        ? usuariosResponse.data
        : usuariosResponse.data.results || [];

      // Create a map of user IDs to user names
      const usuariosMap = {};
      usuariosData.forEach((user) => {
        if (user.id && user.first_name) {
          usuariosMap[user.id] = `${user.first_name} ${
            user.last_name || ""
          }`.trim();
        }
      });

      // Enrich production data with user names
      producao = producao.map((op) => ({
        ...op,
        criado_por_nome: usuariosMap[op.criado_por] || "N/A",
      }));
    } catch (userError) {
      console.warn(
        "Aviso: Não foi possível buscar dados de usuários:",
        userError.message
      );
      // Continue com os dados de produção mesmo se não conseguir os usuários
    }

    res.render("producao", {
      title: "Controle de Produção - UsinaSoft",
      user: req.session.user,
      showHeader: true,
      showNav: true,
      showFooter: true,
      currentPage: "producao",
      producao,
      error: null,
      getStatusClass,
      getStatusIcon,
      getStatusLabel,
      formatDate,
    });
  } catch (error) {
    console.error("Erro ao buscar dados de produção:", error.message);
    res.render("producao", {
      title: "Controle de Produção - UsinaSoft",
      user: req.session.user,
      showHeader: true,
      showNav: true,
      showFooter: true,
      currentPage: "producao",
      producao: [],
      error: "Erro ao buscar dados da API",
      getStatusClass,
      getStatusIcon,
      getStatusLabel,
      formatDate,
    });
  }
});

app.get("/indicadores", requireAuth, (req, res) => {
  // Dados mockados para indicadores
  const indicadores = {
    emFila: 32,
    emAndamento: 45,
    concluidas: 120,
  };

  res.render("indicadores", {
    title: "Indicadores - UsinaSoft",
    user: req.session.user,
    showHeader: true,
    showNav: true,
    showFooter: true,
    currentPage: "indicadores",
    indicadores,
  });
});

// Rota raiz redireciona para login
app.get("/", (req, res) => {
  res.redirect("/login");
});

app.listen(PORT, () => {
  console.log(`UsinaSoft rodando na porta ${PORT}`);
  console.log(`Acesse: http://localhost:${PORT}`);
});
