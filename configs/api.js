const axios = require("axios");

const api = axios.create({
  baseURL: "http://localhost:8000/api", // Django rodando localmente
  timeout: 10000, // 10 segundos
});

// Armazenar a sessão temporariamente para uso nos interceptors
let currentSession = null;

// Função para definir a sessão atual
api.setSession = (session) => {
  currentSession = session;
};

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

// Interceptor para lidar com erros de autenticação
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Se receber 401 e ainda não tentou fazer refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Se temos um refresh token na sessão, tentar renovar
        if (currentSession?.refreshToken) {
          const response = await axios.post(
            "http://localhost:8000/api/auth/token/refresh/",
            {
              refresh: currentSession.refreshToken,
            }
          );

          const { access } = response.data;

          // Atualizar o token na sessão
          if (currentSession) {
            currentSession.token = access;
          }

          // Atualizar o header Authorization
          api.defaults.headers.common["Authorization"] = `Bearer ${access}`;
          originalRequest.headers["Authorization"] = `Bearer ${access}`;

          // Tentar a requisição novamente com o novo token
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Se o refresh falhar, a sessão expirou completamente
        console.error("Erro ao renovar token:", refreshError);

        // Limpar a sessão
        if (currentSession) {
          currentSession.token = null;
          currentSession.refreshToken = null;
          currentSession.user = null;
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

module.exports = api;
