// Status helper functions for production management

const getStatusClass = (status) => {
  const statusMap = {
    aberta: "bg-warning text-dark",
    em_andamento: "bg-info text-white",
    andamento: "bg-info text-white",
    pausada: "bg-secondary text-white",
    concluida: "bg-success text-white",
    concluido: "bg-success text-white",
    cancelada: "bg-danger text-white",
  };
  return statusMap[(status || "").toLowerCase()] || "bg-secondary text-white";
};

const getStatusIcon = (status) => {
  const iconMap = {
    aberta: "fas fa-hourglass-start",
    em_andamento: "fas fa-cogs",
    andamento: "fas fa-cogs",
    pausada: "fas fa-pause-circle",
    concluida: "fas fa-check-circle",
    concluido: "fas fa-check-circle",
    cancelada: "fas fa-times-circle",
  };
  return iconMap[(status || "").toLowerCase()] || "fas fa-question-circle";
};

const getStatusLabel = (status) => {
  const labelMap = {
    aberta: "Na Fila",
    em_andamento: "Em Andamento",
    andamento: "Em Andamento",
    pausada: "Pausada",
    concluida: "Concluída",
    concluido: "Concluída",
    cancelada: "Cancelada",
  };
  return labelMap[(status || "").toLowerCase()] || status || "Desconhecido";
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("pt-BR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

module.exports = {
  getStatusClass,
  getStatusIcon,
  getStatusLabel,
  formatDate,
};
