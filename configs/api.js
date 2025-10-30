const axios = require("axios");

const api = axios.create({
  baseURL: "http://localhost:8000/api", // Django rodando localmente
  timeout: 10000, // 10 segundos
});

module.exports = api;
