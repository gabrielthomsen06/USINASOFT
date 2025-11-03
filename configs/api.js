const axios = require("axios");

const api = axios.create({
  baseURL: "http://localhost:8000/api", // Django rodando localmente
  timeout: 10000, // 10 segundos
});

// Interceptor para adicionar o token de autenticação
api.interceptors.request.use(
  (config) => {
    // Aqui você precisaria de uma forma de obter o token
    // Por exemplo, de um armazenamento local ou de um estado global
    // Como este é o backend do Node, o token virá da sessão do usuário
    // Esta lógica será adicionada no middleware ou nas rotas que usam a API
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

module.exports = api;
