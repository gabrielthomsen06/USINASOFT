// Configurações da aplicação
require("dotenv").config();

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:8000/api";
const NODE_ENV = process.env.NODE_ENV || "development";

module.exports = {
  API_BASE_URL,
  NODE_ENV,
};
