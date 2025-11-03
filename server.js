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
  getPrioridadeLabel,
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

// Middleware para adicionar token de autenticação às chamadas da API
const addAuthToken = (req, res, next) => {
  if (req.session.token) {
    api.defaults.headers.common[
      "Authorization"
    ] = `Bearer ${req.session.token}`;
  }
  next();
};

// ===== ROTAS DE AUTENTICAÇÃO =====
app.get("/login", (req, res) => {
  res.render("login", {
    title: "Login - UsinaSoft",
    error: req.query.error,
    success: req.query.success,
  });
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const response = await axios.post(`${apiBaseUrl}auth/token/`, {
      email,
      password,
    });

    const { access, refresh } = response.data;

    // Armazenar tokens e informações do usuário na sessão
    req.session.token = access;
    req.session.refreshToken = refresh;
    req.session.user = { email }; // Você pode decodificar o token para obter mais dados

    // Configurar o token para chamadas futuras da API nesta sessão
    api.defaults.headers.common["Authorization"] = `Bearer ${access}`;

    res.redirect("/menu");
  } catch (error) {
    let errorMessage = "Erro ao fazer login. Verifique suas credenciais.";
    if (error.response && error.response.status === 401) {
      errorMessage = "Credenciais inválidas. Tente novamente.";
    }
    res.render("login", {
      title: "Login - UsinaSoft",
      error: errorMessage,
    });
  }
});

app.get("/logout", (req, res) => {
  // Limpar o token do header da API
  delete api.defaults.headers.common["Authorization"];

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

app.post("/cadastro-usuario", async (req, res) => {
  const {
    nome,
    sobrenome,
    email,
    senha,
    confirmarSenha,
    telefone,
    cargo,
    empresa,
  } = req.body;

  if (senha !== confirmarSenha) {
    return res.render("cadastro-usuario", {
      title: "Cadastro de Usuário - UsinaSoft",
      error: "As senhas não coincidem",
    });
  }

  try {
    await axios.post(`${apiBaseUrl}usuarios/`, {
      first_name: nome,
      last_name: sobrenome,
      email,
      password: senha,
      // Outros campos podem ser necessários dependendo da sua API
    });

    res.redirect(
      "/login?success=Conta criada com sucesso! Faça login para acessar o sistema."
    );
  } catch (error) {
    let errorMessage = "Erro ao criar a conta.";
    if (error.response && error.response.data) {
      // Tenta extrair uma mensagem de erro mais específica da API
      const apiErrors = error.response.data;
      errorMessage = Object.values(apiErrors).flat().join(" ");
    }
    res.render("cadastro-usuario", {
      title: "Cadastro de Usuário - UsinaSoft",
      error: errorMessage,
    });
  }
});

// Aplicar middleware de autenticação e token a todas as rotas principais
app.use(requireAuth);
app.use(addAuthToken);

// ===== ROTAS PRINCIPAIS =====
app.get("/menu", (req, res) => {
  res.render("menu", {
    title: "Menu Principal - UsinaSoft",
    user: req.session.user,
    showHeader: true,
    showNav: true,
    showFooter: true,
    currentPage: "menu",
  });
});

// ===== ROTAS DE CLIENTES =====
app.get("/clientes", async (req, res) => {
  try {
    const clientesResponse = await api.get("/clientes/");
    const clientes = Array.isArray(clientesResponse.data)
      ? clientesResponse.data
      : clientesResponse.data.results || [];

    res.render("clientes", {
      title: "Cadastro de Clientes - UsinaSoft",
      user: req.session.user,
      showHeader: true,
      showNav: true,
      showFooter: true,
      currentPage: "clientes",
      clientes,
      success: req.query.success === "true",
      error: null,
    });
  } catch (error) {
    console.error("Erro ao buscar clientes:", error.message);
    res.render("clientes", {
      title: "Cadastro de Clientes - UsinaSoft",
      user: req.session.user,
      showHeader: true,
      showNav: true,
      showFooter: true,
      currentPage: "clientes",
      clientes: [],
      success: false,
      error: "Erro ao carregar clientes. Tente novamente.",
    });
  }
});

app.post("/clientes", async (req, res) => {
  const { nome, cnpj, email, telefone, endereco } = req.body;

  try {
    if (!nome) {
      throw new Error("Nome do cliente é obrigatório");
    }

    const clienteResponse = await api.post("/clientes/", {
      nome,
      cnpj: cnpj || "",
      email: email || "",
      telefone: telefone || "",
      endereco: endereco || "",
    });

    console.log("Cliente cadastrado com sucesso:", clienteResponse.data);

    // Se a requisição for AJAX, retornar JSON
    if (req.headers.accept && req.headers.accept.includes("application/json")) {
      return res.json({
        success: true,
        cliente: clienteResponse.data,
        message: "Cliente cadastrado com sucesso!",
      });
    }

    res.redirect("/clientes?success=true");
  } catch (error) {
    console.error("Erro ao cadastrar cliente:", error);

    let errorMessage = "Erro ao cadastrar o cliente. Tente novamente.";

    if (error.response) {
      if (error.response.status === 401) {
        errorMessage = "Sessão expirada. Faça login novamente.";
        if (
          req.headers.accept &&
          req.headers.accept.includes("application/json")
        ) {
          return res.status(401).json({ success: false, error: errorMessage });
        }
        return res.redirect("/login?error=" + encodeURIComponent(errorMessage));
      }

      if (error.response.data) {
        const apiErrors = error.response.data;
        errorMessage = Object.entries(apiErrors)
          .map(([field, messages]) => {
            const msgs = Array.isArray(messages) ? messages : [messages];
            return `${field}: ${msgs.join(", ")}`;
          })
          .join("; ");
      }
    } else if (error.message) {
      errorMessage = error.message;
    }

    // Se a requisição for AJAX, retornar JSON
    if (req.headers.accept && req.headers.accept.includes("application/json")) {
      return res.status(400).json({ success: false, error: errorMessage });
    }

    try {
      const clientesResponse = await api.get("/clientes/");
      const clientes = Array.isArray(clientesResponse.data)
        ? clientesResponse.data
        : clientesResponse.data.results || [];

      res.render("clientes", {
        title: "Cadastro de Clientes - UsinaSoft",
        user: req.session.user,
        showHeader: true,
        showNav: true,
        showFooter: true,
        currentPage: "clientes",
        clientes,
        success: false,
        error: errorMessage,
      });
    } catch (clientError) {
      res.render("clientes", {
        title: "Cadastro de Clientes - UsinaSoft",
        user: req.session.user,
        showHeader: true,
        showNav: true,
        showFooter: true,
        currentPage: "clientes",
        clientes: [],
        success: false,
        error: errorMessage,
      });
    }
  }
});

app.get("/cadastro", async (req, res) => {
  const success = req.query.success === "true";

  try {
    // Buscar lista de clientes para o select
    const clientesResponse = await api.get("/clientes/");
    const clientes = Array.isArray(clientesResponse.data)
      ? clientesResponse.data
      : clientesResponse.data.results || [];

    res.render("cadastro", {
      title: "Cadastro de Peças - UsinaSoft",
      user: req.session.user,
      showHeader: true,
      showNav: true,
      showFooter: true,
      currentPage: "cadastro",
      success,
      clientes,
      error: null,
    });
  } catch (error) {
    console.error("Erro ao buscar clientes:", error.message);
    res.render("cadastro", {
      title: "Cadastro de Peças - UsinaSoft",
      user: req.session.user,
      showHeader: true,
      showNav: true,
      showFooter: true,
      currentPage: "cadastro",
      success: false,
      clientes: [],
      error: "Erro ao carregar dados. Tente novamente.",
    });
  }
});

app.post("/cadastro", async (req, res) => {
  const { cliente, codigoPeca, nomePeca, descricao, prioridade } = req.body;

  try {
    // Validação básica
    if (!cliente || !codigoPeca) {
      throw new Error("Cliente e código da peça são obrigatórios");
    }

    // Converter prioridade para número conforme esperado pela API
    let prioridadeNum = 1; // baixa
    if (prioridade === "media") prioridadeNum = 3;
    if (prioridade === "alta") prioridadeNum = 5;

    // Criar a peça na API Django
    const pecaResponse = await api.post("/pecas/", {
      codigo: codigoPeca,
      nome: nomePeca || codigoPeca,
      descricao: descricao || "",
      cliente: parseInt(cliente),
      prioridade: prioridadeNum,
    });

    console.log("Peça cadastrada com sucesso:", pecaResponse.data);

    res.redirect("/cadastro?success=true");
  } catch (error) {
    console.error("Erro ao cadastrar peça:", error);

    let errorMessage = "Erro ao cadastrar a peça. Tente novamente.";

    if (error.response) {
      // A API retornou um erro
      console.error("Resposta de erro da API:", error.response.data);
      console.error("Status:", error.response.status);

      if (error.response.status === 401) {
        errorMessage = "Sessão expirada. Faça login novamente.";
        return res.redirect("/login?error=" + encodeURIComponent(errorMessage));
      }

      if (error.response.data) {
        const apiErrors = error.response.data;
        errorMessage = Object.entries(apiErrors)
          .map(([field, messages]) => {
            const msgs = Array.isArray(messages) ? messages : [messages];
            return `${field}: ${msgs.join(", ")}`;
          })
          .join("; ");
      }
    } else if (error.message) {
      errorMessage = error.message;
    }

    try {
      const clientesResponse = await api.get("/clientes/");
      const clientes = Array.isArray(clientesResponse.data)
        ? clientesResponse.data
        : clientesResponse.data.results || [];

      res.render("cadastro", {
        title: "Cadastro de Peças - UsinaSoft",
        user: req.session.user,
        showHeader: true,
        showNav: true,
        showFooter: true,
        currentPage: "cadastro",
        success: false,
        clientes,
        error: errorMessage,
      });
    } catch (clientError) {
      res.render("cadastro", {
        title: "Cadastro de Peças - UsinaSoft",
        user: req.session.user,
        showHeader: true,
        showNav: true,
        showFooter: true,
        currentPage: "cadastro",
        success: false,
        clientes: [],
        error: errorMessage,
      });
    }
  }
});

app.get("/atividades", async (req, res) => {
  try {
    // Buscar atividades da API
    const atividadesResponse = await api.get(`/atividades/`);
    const usuariosResponse = await api.get(`/usuarios/`);

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

    // Enriquecer dados de atividades com nomes de usuários e labels de prioridade
    atividades = atividades.map((atividade) => ({
      ...atividade,
      responsavel_nome: usuariosMap[atividade.responsavel] || "Não atribuído",
      prioridade_label: getPrioridadeLabel(atividade.prioridade),
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
      getPrioridadeLabel,
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
      error:
        "Erro ao carregar atividades. Verifique sua autenticação e tente novamente.",
      getStatusClass,
      getStatusIcon,
      getStatusLabel,
      getPrioridadeLabel,
      formatDate,
    });
  }
});

// ROTA DE INDICADORES /indicadores
app.get("/indicadores", async (req, res) => {
  try {
    const { start, end, date_field } = req.query;

    const params = {};
    if (start) params.start = start;
    if (end) params.end = end;
    if (date_field) params.date_field = date_field;

    const indicadoresResponse = await api.get(`/indicadores/summary/`, {
      params,
    });
    const indicadores = indicadoresResponse.data;

    // Normalizar os dados para garantir que todas as chaves existam
    if (indicadores) {
      const defaultStatus = {
        aberta: 0,
        em_andamento: 0,
        pausada: 0,
        concluida: 0,
        cancelada: 0,
      };
      indicadores.por_status = { ...defaultStatus, ...indicadores.por_status };

      const defaultAgrupado = {
        emFila: 0,
        emAndamento: 0,
        concluidas: 0,
      };
      indicadores.agrupado = { ...defaultAgrupado, ...indicadores.agrupado };
    }

    res.render("indicadores", {
      title: "Indicadores de Produção - UsinaSoft",
      user: req.session.user,
      showHeader: true,
      showNav: true,
      showFooter: true,
      currentPage: "indicadores",
      indicadores,
      query: req.query, // Passar os query params para preencher os filtros
      error: null,
    });
  } catch (error) {
    console.error("Erro ao buscar indicadores:", error.message);
    res.render("indicadores", {
      title: "Indicadores de Produção - UsinaSoft",
      user: req.session.user,
      showHeader: true,
      showNav: true,
      showFooter: true,
      currentPage: "indicadores",
      indicadores: null,
      query: req.query,
      error:
        "Erro ao carregar os indicadores. Verifique sua autenticação e tente novamente.",
    });
  }
});

//ROTA DE PRODUCAO /producao
app.get("/producao", async (req, res) => {
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
      error:
        "Erro ao buscar dados da API. Verifique sua autenticação e tente novamente.",
      getStatusClass,
      getStatusIcon,
      getStatusLabel,
      formatDate,
    });
  }
});

app.get("/indicadores", (req, res) => {
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
  if (req.session.user) {
    res.redirect("/menu");
  } else {
    res.redirect("/login");
  }
});

app.listen(PORT, () => {
  console.log(`UsinaSoft rodando na porta ${PORT}`);
  console.log(`Acesse: http://localhost:${PORT}`);
});
