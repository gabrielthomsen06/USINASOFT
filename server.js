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

    // Passar a sessão para o interceptor da API
    api.setSession(req.session);
  }
  next();
};

// ===== ROTAS DE AUTENTICAÇÃO =====
app.get("/login", (req, res) => {
  res.render("login", {
    title: "Login - UsinaSoft",
    error: req.query.error || null,
    success: req.query.success || null,
  });
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    console.log("Tentando login com:", email);
    console.log("URL da API:", `${apiBaseUrl}auth/token/`);

    const response = await axios.post(`${apiBaseUrl}auth/token/`, {
      email,
      password,
    });

    console.log("Login bem-sucedido!");
    const { access, refresh, user } = response.data;

    // Armazenar tokens e informações do usuário na sessão
    req.session.token = access;
    req.session.refreshToken = refresh;

    // Armazenar dados completos do usuário (se retornados pela API)
    // Caso contrário, buscar os dados do usuário
    if (user) {
      req.session.user = user;
    } else {
      // Buscar dados do usuário logado
      try {
        api.defaults.headers.common["Authorization"] = `Bearer ${access}`;
        const userResponse = await api.get("/auth/me/");
        req.session.user = {
          id: userResponse.data.id,
          email: userResponse.data.email,
          first_name: userResponse.data.first_name,
          last_name: userResponse.data.last_name,
        };
      } catch (userError) {
        console.warn(
          "Não foi possível buscar dados do usuário:",
          userError.message
        );
        req.session.user = { email };
      }
    }

    // Configurar o token para chamadas futuras da API nesta sessão
    api.defaults.headers.common["Authorization"] = `Bearer ${access}`;

    res.redirect("/menu");
  } catch (error) {
    console.error("Erro no login:", error.message);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Dados:", error.response.data);
    }

    let errorMessage = "Erro ao fazer login. Verifique suas credenciais.";
    if (error.response && error.response.status === 401) {
      errorMessage = "Credenciais inválidas. Tente novamente.";
    } else if (error.code === "ECONNREFUSED") {
      errorMessage =
        "Não foi possível conectar ao servidor de autenticação. Verifique se a API está rodando.";
    } else if (error.message) {
      errorMessage = `Erro ao fazer login: ${error.message}`;
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

// Função auxiliar para verificar se o erro é de autenticação
const isAuthError = (error) => {
  return error.response && error.response.status === 401;
};

// Função auxiliar para lidar com erros de autenticação
const handleAuthError = (
  req,
  res,
  errorMessage = "Sessão expirada. Faça login novamente."
) => {
  // Limpar a sessão
  req.session.token = null;
  req.session.refreshToken = null;
  req.session.user = null;

  // Limpar o header da API
  delete api.defaults.headers.common["Authorization"];

  // Redirecionar para login
  return res.redirect("/login?error=" + encodeURIComponent(errorMessage));
};

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

    // Se for erro de autenticação, redirecionar para login
    if (isAuthError(error)) {
      return handleAuthError(req, res);
    }

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

// Rota para editar cliente (PUT/PATCH)
app.put("/clientes/:id", async (req, res) => {
  const { id } = req.params;
  const { nome, cnpj, email, telefone, endereco } = req.body;

  try {
    const clienteResponse = await api.put(`/clientes/${id}/`, {
      nome,
      cnpj: cnpj || "",
      email: email || "",
      telefone: telefone || "",
      endereco: endereco || "",
    });

    return res.json({
      success: true,
      cliente: clienteResponse.data,
      message: "Cliente atualizado com sucesso!",
    });
  } catch (error) {
    console.error("Erro ao atualizar cliente:", error);
    let errorMessage = "Erro ao atualizar o cliente.";

    if (error.response?.data) {
      const apiErrors = error.response.data;
      errorMessage = Object.entries(apiErrors)
        .map(([field, messages]) => {
          const msgs = Array.isArray(messages) ? messages : [messages];
          return `${field}: ${msgs.join(", ")}`;
        })
        .join("; ");
    }

    return res.status(400).json({ success: false, error: errorMessage });
  }
});

// Rota para excluir cliente (DELETE)
app.delete("/clientes/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await api.delete(`/clientes/${id}/`);
    return res.json({
      success: true,
      message: "Cliente excluído com sucesso!",
    });
  } catch (error) {
    console.error("Erro ao excluir cliente:", error);
    return res.status(400).json({
      success: false,
      error: "Erro ao excluir o cliente.",
    });
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

    // Buscar lista de OPs existentes
    const opsResponse = await api.get("/ops/");
    const ops = Array.isArray(opsResponse.data)
      ? opsResponse.data
      : opsResponse.data.results || [];

    res.render("cadastro", {
      title: "Cadastro de Peças - UsinaSoft",
      user: req.session.user,
      showHeader: true,
      showNav: true,
      showFooter: true,
      currentPage: "cadastro",
      success,
      clientes,
      ops,
      error: null,
    });
  } catch (error) {
    console.error("Erro ao buscar dados:", error.message);

    // Se for erro de autenticação, redirecionar para login
    if (isAuthError(error)) {
      return handleAuthError(req, res);
    }

    res.render("cadastro", {
      title: "Cadastro de Peças - UsinaSoft",
      user: req.session.user,
      showHeader: true,
      showNav: true,
      showFooter: true,
      currentPage: "cadastro",
      success: false,
      clientes: [],
      ops: [],
      error: "Erro ao carregar dados. Tente novamente.",
    });
  }
});

app.post("/cadastro", async (req, res) => {
  const {
    cliente,
    codigoPeca,
    nomePeca,
    descricao,
    prioridade,
    ordemProducao,
    quantidade,
    dataEntrega,
  } = req.body;

  try {
    // Validação básica
    if (!cliente || !codigoPeca) {
      throw new Error("Cliente e código da peça são obrigatórios");
    }

    if (!ordemProducao) {
      throw new Error(
        "Número da Ordem de Produção (Nota Fiscal) é obrigatório"
      );
    }

    // Converter prioridade para número conforme esperado pela API
    let prioridadeNum = 1; // baixa
    if (prioridade === "media") prioridadeNum = 3;
    if (prioridade === "alta") prioridadeNum = 5;

    // Preparar dados da peça
    const pecaData = {
      ordem_producao_codigo: ordemProducao, // Número da NF - cria/associa OP automaticamente
      cliente: cliente, // UUID do cliente (não converter para int)
      codigo: codigoPeca,
      nome: nomePeca || codigoPeca,
      descricao: descricao || "",
      quantidade: parseInt(quantidade) || 1,
      prioridade: prioridadeNum,
      data_entrega: dataEntrega || null,
      status: "em_fila", // Status inicial
    };

    // Adicionar dados do usuário criador se disponível
    if (req.session.user) {
      if (req.session.user.id) {
        pecaData.criado_por = req.session.user.id;
      }
      if (req.session.user.email) {
        pecaData.criado_por_email = req.session.user.email;
      }
    }

    // Criar a peça na API Django
    const pecaResponse = await api.post("/pecas/", pecaData);

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

      // Tentar buscar OPs também
      let ops = [];
      try {
        const opsResponse = await api.get("/ops/");
        ops = Array.isArray(opsResponse.data)
          ? opsResponse.data
          : opsResponse.data.results || [];
      } catch (opsError) {
        console.warn("Aviso: Não foi possível buscar OPs:", opsError.message);
      }

      res.render("cadastro", {
        title: "Cadastro de Peças - UsinaSoft",
        user: req.session.user,
        showHeader: true,
        showNav: true,
        showFooter: true,
        currentPage: "cadastro",
        success: false,
        clientes,
        ops,
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
        ops: [],
        error: errorMessage,
      });
    }
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
    const data = indicadoresResponse.data;

    // Transformar os dados do backend para o formato esperado pelo frontend
    const indicadores = {
      periodo: data.periodo || {},
      total: data.ordens_producao?.total || 0,
      por_status: data.ordens_producao?.por_status || {},
      detalhes_por_status: data.ordens_producao?.detalhes_por_status || [],
      tempo_medio_producao_dias:
        data.ordens_producao?.tempo_medio_producao_dias || 0,
      agrupado: {
        emFila: data.pecas?.por_status?.em_fila || 0,
        emAndamento: data.pecas?.por_status?.em_andamento || 0,
        concluidas: data.pecas?.por_status?.concluida || 0,
      },
      pecas: data.pecas || {},
    };

    // Normalizar os dados para garantir que todas as chaves existam
    const defaultStatus = {
      aberta: 0,
      em_andamento: 0,
      pausada: 0,
      concluida: 0,
      cancelada: 0,
    };
    indicadores.por_status = { ...defaultStatus, ...indicadores.por_status };

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

    // Se for erro de autenticação, redirecionar para login
    if (isAuthError(error)) {
      return handleAuthError(req, res);
    }

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

    // Se for erro de autenticação, redirecionar para login
    if (isAuthError(error)) {
      return handleAuthError(req, res);
    }

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

// Rota para visualizar detalhes de uma OP (página HTML)
app.get("/ops/:id/detalhes", async (req, res) => {
  const { id } = req.params;

  try {
    // Buscar dados da OP
    const opResponse = await api.get(`/ops/${id}/`);
    const op = opResponse.data;

    console.log("OP encontrada:", op.id, op.codigo);

    // Buscar peças da OP - usar o ID da OP
    const pecasResponse = await api.get(`/pecas/?ordem_producao=${op.id}`);
    console.log("URL de busca de peças:", `/pecas/?ordem_producao=${op.id}`);
    console.log("Resposta de peças:", pecasResponse.data);

    const pecas = Array.isArray(pecasResponse.data)
      ? pecasResponse.data
      : pecasResponse.data.results || [];

    res.render("op-detalhes", {
      title: `OP ${op.codigo} - Detalhes - UsinaSoft`,
      user: req.session.user,
      showHeader: true,
      showNav: true,
      showFooter: true,
      currentPage: "producao",
      op,
      pecas,
      getStatusClass,
      getStatusIcon,
      getStatusLabel,
      getPrioridadeLabel,
      formatDate,
      error: null,
    });
  } catch (error) {
    console.error("Erro ao buscar detalhes da OP:", error.message);

    // Se for erro de autenticação, redirecionar para login
    if (isAuthError(error)) {
      return handleAuthError(req, res);
    }

    res.render("op-detalhes", {
      title: "Detalhes da OP - UsinaSoft",
      user: req.session.user,
      showHeader: true,
      showNav: true,
      showFooter: true,
      currentPage: "producao",
      op: null,
      pecas: [],
      getStatusClass,
      getStatusIcon,
      getStatusLabel,
      getPrioridadeLabel,
      formatDate,
      error: "Erro ao carregar detalhes da ordem de produção.",
    });
  }
});

// Rota para buscar uma OP específica (GET - API JSON)
app.get("/api/ops/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const opResponse = await api.get(`/ops/${id}/`);
    return res.json(opResponse.data);
  } catch (error) {
    console.error("Erro ao buscar OP:", error);
    return res.status(400).json({
      success: false,
      error: "Erro ao buscar a ordem de produção.",
    });
  }
});

// Rota para buscar usuários (GET)
app.get("/api/usuarios", async (req, res) => {
  try {
    const usuariosResponse = await api.get("/usuarios/");
    return res.json(usuariosResponse.data);
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    return res.status(400).json({
      success: false,
      error: "Erro ao buscar usuários.",
    });
  }
});

// Rota para editar OP (PUT/PATCH)
app.put("/ops/:id", async (req, res) => {
  const { id } = req.params;
  const { codigo, cliente, data_entrega, observacoes, status, responsavel } =
    req.body;

  try {
    const opData = {
      codigo,
      cliente,
      data_entrega: data_entrega || null,
      observacoes: observacoes || "",
      status: status || "aberta",
    };

    // Adicionar responsável se foi fornecido
    if (responsavel) {
      opData.responsavel = responsavel;
    }

    const opResponse = await api.put(`/ops/${id}/`, opData);

    return res.json({
      success: true,
      op: opResponse.data,
      message: "Ordem de produção atualizada com sucesso!",
    });
  } catch (error) {
    console.error("Erro ao atualizar OP:", error);
    let errorMessage = "Erro ao atualizar a ordem de produção.";

    if (error.response?.data) {
      const apiErrors = error.response.data;
      errorMessage = Object.entries(apiErrors)
        .map(([field, messages]) => {
          const msgs = Array.isArray(messages) ? messages : [messages];
          return `${field}: ${msgs.join(", ")}`;
        })
        .join("; ");
    }

    return res.status(400).json({ success: false, error: errorMessage });
  }
});

// Rota para excluir OP (DELETE)
app.delete("/ops/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await api.delete(`/ops/${id}/`);
    return res.json({
      success: true,
      message: "Ordem de produção excluída com sucesso!",
    });
  } catch (error) {
    console.error("Erro ao excluir OP:", error);
    return res.status(400).json({
      success: false,
      error: "Erro ao excluir a ordem de produção.",
    });
  }
});

// Rota para editar peça (PUT/PATCH)
app.put("/pecas/:id", async (req, res) => {
  const { id } = req.params;
  const {
    codigo,
    nome,
    descricao,
    quantidade,
    prioridade,
    status,
    data_entrega,
  } = req.body;

  try {
    // Se apenas o status foi enviado, fazer um PATCH
    if (status && Object.keys(req.body).length === 1) {
      const pecaResponse = await api.patch(`/pecas/${id}/`, {
        status: status,
      });

      return res.json({
        success: true,
        peca: pecaResponse.data,
        message: "Status da peça atualizado com sucesso!",
      });
    }

    // Caso contrário, atualizar todos os campos
    const pecaResponse = await api.put(`/pecas/${id}/`, {
      codigo,
      nome,
      descricao: descricao || "",
      quantidade: parseInt(quantidade) || 1,
      prioridade: parseInt(prioridade) || 1,
      status: status || "em_fila",
      data_entrega: data_entrega || null,
    });

    return res.json({
      success: true,
      peca: pecaResponse.data,
      message: "Peça atualizada com sucesso!",
    });
  } catch (error) {
    console.error("Erro ao atualizar peça:", error);
    let errorMessage = "Erro ao atualizar a peça.";

    if (error.response?.data) {
      const apiErrors = error.response.data;
      errorMessage = Object.entries(apiErrors)
        .map(([field, messages]) => {
          const msgs = Array.isArray(messages) ? messages : [messages];
          return `${field}: ${msgs.join(", ")}`;
        })
        .join("; ");
    }

    return res.status(400).json({ success: false, error: errorMessage });
  }
});

// Rota para excluir peça (DELETE)
app.delete("/pecas/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await api.delete(`/pecas/${id}/`);
    return res.json({
      success: true,
      message: "Peça excluída com sucesso!",
    });
  } catch (error) {
    console.error("Erro ao excluir peça:", error);
    return res.status(400).json({
      success: false,
      error: "Erro ao excluir a peça.",
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
