// ===== USINASOFT - JAVASCRIPT PRINCIPAL =====

// Configurações globais
const UsinaSoft = {
  config: {
    apiUrl: "/api",
    version: "1.0.0",
  },

  // Utilitários
  utils: {
    // Formatar data
    formatDate: (date) => {
      return new Date(date).toLocaleDateString("pt-BR");
    },

    // Formatar moeda
    formatCurrency: (value) => {
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(value);
    },

    // Debounce para otimizar chamadas
    debounce: (func, wait) => {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    },

    // Mostrar notificação
    showNotification: (message, type = "info") => {
      const notification = document.createElement("div");
      notification.className = `notification notification-${type}`;
      notification.innerHTML = `
                <div class="notification-content">
                    <span class="notification-message">${message}</span>
                    <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
                </div>
            `;

      document.body.appendChild(notification);

      // Auto remove após 5 segundos
      setTimeout(() => {
        if (notification.parentElement) {
          notification.remove();
        }
      }, 5000);
    },

    // Confirmar ação
    confirm: (message, callback) => {
      if (window.confirm(message)) {
        callback();
      }
    },
  },

  // Gerenciamento de estado
  state: {
    currentUser: null,
    producao: [],

    // Atualizar estado
    update: (key, value) => {
      UsinaSoft.state[key] = value;
      UsinaSoft.events.emit("stateChange", { key, value });
    },

    // Obter estado
    get: (key) => {
      return UsinaSoft.state[key];
    },
  },

  // Sistema de eventos
  events: {
    listeners: {},

    // Registrar listener
    on: (event, callback) => {
      if (!UsinaSoft.events.listeners[event]) {
        UsinaSoft.events.listeners[event] = [];
      }
      UsinaSoft.events.listeners[event].push(callback);
    },

    // Emitir evento
    emit: (event, data) => {
      if (UsinaSoft.events.listeners[event]) {
        UsinaSoft.events.listeners[event].forEach((callback) => {
          callback(data);
        });
      }
    },

    // Remover listener
    off: (event, callback) => {
      if (UsinaSoft.events.listeners[event]) {
        UsinaSoft.events.listeners[event] = UsinaSoft.events.listeners[
          event
        ].filter((cb) => cb !== callback);
      }
    },
  },

  // API calls
  api: {
    // Requisição genérica
    request: async (url, options = {}) => {
      const defaultOptions = {
        headers: {
          "Content-Type": "application/json",
        },
      };

      const config = { ...defaultOptions, ...options };

      try {
        const response = await fetch(url, config);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
      } catch (error) {
        console.error("API request failed:", error);
        UsinaSoft.utils.showNotification(
          "Erro na comunicação com o servidor",
          "error"
        );
        throw error;
      }
    },

    // GET request
    get: (endpoint) => {
      return UsinaSoft.api.request(`${UsinaSoft.config.apiUrl}${endpoint}`);
    },

    // POST request
    post: (endpoint, data) => {
      return UsinaSoft.api.request(`${UsinaSoft.config.apiUrl}${endpoint}`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    // PUT request
    put: (endpoint, data) => {
      return UsinaSoft.api.request(`${UsinaSoft.config.apiUrl}${endpoint}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },

    // DELETE request
    delete: (endpoint) => {
      return UsinaSoft.api.request(`${UsinaSoft.config.apiUrl}${endpoint}`, {
        method: "DELETE",
      });
    },
  },
};

// ===== INICIALIZAÇÃO =====
document.addEventListener("DOMContentLoaded", function () {
  // Inicializar componentes
  initializeComponents();

  // Configurar eventos globais
  setupGlobalEvents();

  // Carregar dados iniciais
  loadInitialData();
});

// ===== COMPONENTES =====
function initializeComponents() {
  // Inicializar tooltips
  initializeTooltips();

  // Inicializar modais
  initializeModals();

  // Inicializar formulários
  initializeForms();
}

function initializeTooltips() {
  const tooltipElements = document.querySelectorAll("[data-tooltip]");

  tooltipElements.forEach((element) => {
    element.addEventListener("mouseenter", showTooltip);
    element.addEventListener("mouseleave", hideTooltip);
  });
}

function showTooltip(event) {
  const element = event.target;
  const text = element.getAttribute("data-tooltip");

  const tooltip = document.createElement("div");
  tooltip.className = "tooltip";
  tooltip.textContent = text;
  tooltip.id = "tooltip";

  document.body.appendChild(tooltip);

  const rect = element.getBoundingClientRect();
  tooltip.style.left =
    rect.left + rect.width / 2 - tooltip.offsetWidth / 2 + "px";
  tooltip.style.top = rect.top - tooltip.offsetHeight - 5 + "px";
}

function hideTooltip() {
  const tooltip = document.getElementById("tooltip");
  if (tooltip) {
    tooltip.remove();
  }
}

function initializeModals() {
  // Fechar modal ao clicar fora
  document.addEventListener("click", function (event) {
    if (event.target.classList.contains("modal")) {
      closeModal(event.target);
    }
  });

  // Fechar modal com ESC
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      const openModal = document.querySelector(".modal.active");
      if (openModal) {
        closeModal(openModal);
      }
    }
  });
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
  }
}

function closeModal(modal) {
  if (typeof modal === "string") {
    modal = document.getElementById(modal);
  }

  if (modal) {
    modal.classList.remove("active");
    document.body.style.overflow = "";
  }
}

function initializeForms() {
  // Validação em tempo real
  const forms = document.querySelectorAll("form[data-validate]");

  forms.forEach((form) => {
    const inputs = form.querySelectorAll("input, select, textarea");

    inputs.forEach((input) => {
      input.addEventListener("blur", validateField);
      input.addEventListener("input", clearFieldError);
    });

    form.addEventListener("submit", validateForm);
  });
}

function validateField(event) {
  const field = event.target;
  const value = field.value.trim();

  // Limpar erro anterior
  clearFieldError(event);

  // Validações básicas
  if (field.hasAttribute("required") && !value) {
    showFieldError(field, "Este campo é obrigatório");
    return false;
  }

  if (field.type === "email" && value && !isValidEmail(value)) {
    showFieldError(field, "Email inválido");
    return false;
  }

  if (field.type === "number" && value && isNaN(value)) {
    showFieldError(field, "Valor numérico inválido");
    return false;
  }

  return true;
}

function validateForm(event) {
  const form = event.target;
  const inputs = form.querySelectorAll(
    "input[required], select[required], textarea[required]"
  );
  let isValid = true;

  inputs.forEach((input) => {
    if (!validateField({ target: input })) {
      isValid = false;
    }
  });

  if (!isValid) {
    event.preventDefault();
    UsinaSoft.utils.showNotification(
      "Por favor, corrija os erros no formulário",
      "error"
    );
  }

  return isValid;
}

function showFieldError(field, message) {
  field.classList.add("error");

  let errorElement = field.parentElement.querySelector(".form-error");
  if (!errorElement) {
    errorElement = document.createElement("span");
    errorElement.className = "form-error";
    field.parentElement.appendChild(errorElement);
  }

  errorElement.textContent = message;
}

function clearFieldError(event) {
  const field = event.target;
  field.classList.remove("error");

  const errorElement = field.parentElement.querySelector(".form-error");
  if (errorElement) {
    errorElement.remove();
  }
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// ===== EVENTOS GLOBAIS =====
function setupGlobalEvents() {
  // Logout
  document.addEventListener("click", function (event) {
    if (event.target.matches("[data-logout]")) {
      event.preventDefault();
      UsinaSoft.utils.confirm("Tem certeza que deseja sair?", () => {
        window.location.href = "/logout";
      });
    }
  });

  // Navegação com confirmação
  document.addEventListener("click", function (event) {
    if (event.target.matches("[data-confirm]")) {
      const message = event.target.getAttribute("data-confirm");
      if (!confirm(message)) {
        event.preventDefault();
      }
    }
  });
}

// ===== CARREGAMENTO DE DADOS =====
function loadInitialData() {
  // Carregar dados do usuário se disponível
  const userElement = document.querySelector("[data-user]");
  if (userElement) {
    try {
      const userData = JSON.parse(userElement.getAttribute("data-user"));
      UsinaSoft.state.update("currentUser", userData);
    } catch (error) {
      console.error("Erro ao carregar dados do usuário:", error);
    }
  }
}

// ===== FUNÇÕES GLOBAIS =====
// Tornar funções disponíveis globalmente
window.UsinaSoft = UsinaSoft;
window.openModal = openModal;
window.closeModal = closeModal;

// ===== ESTILOS DINÂMICOS =====
// Adicionar estilos para componentes dinâmicos
const dynamicStyles = document.createElement("style");
dynamicStyles.textContent = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1000;
        max-width: 400px;
        animation: slideIn 0.3s ease;
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    
    .notification-info .notification-content {
        background-color: #e3f2fd;
        color: #1976d2;
        border-left: 4px solid #2196f3;
    }
    
    .notification-success .notification-content {
        background-color: #e8f5e8;
        color: #2e7d32;
        border-left: 4px solid #4caf50;
    }
    
    .notification-error .notification-content {
        background-color: #ffebee;
        color: #c62828;
        border-left: 4px solid #f44336;
    }
    
    .notification-warning .notification-content {
        background-color: #fff3e0;
        color: #ef6c00;
        border-left: 4px solid #ff9800;
    }
    
    .notification-close {
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        margin-left: 12px;
        opacity: 0.7;
    }
    
    .notification-close:hover {
        opacity: 1;
    }
    
    .tooltip {
        position: absolute;
        background-color: #333;
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 14px;
        z-index: 1000;
        pointer-events: none;
    }
    
    .tooltip::after {
        content: '';
        position: absolute;
        top: 100%;
        left: 50%;
        margin-left: -5px;
        border-width: 5px;
        border-style: solid;
        border-color: #333 transparent transparent transparent;
    }
    
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .modal {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 1000;
    }
    
    .modal.active {
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .modal-content {
        background: white;
        border-radius: 8px;
        padding: 24px;
        max-width: 500px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
    }
`;

document.head.appendChild(dynamicStyles);
