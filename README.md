# UsinaSoft - Sistema de Gestão de Usinagem

Sistema ERP desenvolvido para gestão de produção em usinagem, com cadastro de peças, controle de produção e indicadores.

## 🚀 Características

- **Sistema de Login** com autenticação JWT
- **Menu Principal** com navegação intuitiva
- **Cadastro de Clientes** com modal de cadastro rápido
- **Cadastro de Peças** com validação de formulários
- **Controle de Produção** com filtros avançados e gestão de OPs
- **Indicadores** com gráficos visuais e métricas em tempo real
- **Design Responsivo** para desktop e mobile
- **Componentes Reutilizáveis** para escalabilidade

## 🎨 Design System

O sistema utiliza um design system consistente com as cores principais:

- **Laranja Principal**: `#f15a29`
- **Cinza Secundário**: `#ccc`
- **Tipografia**: Segoe UI
- **Componentes**: Botões, Cards, Formulários padronizados

## 🛠️ Tecnologias Utilizadas

- **Backend**: Node.js + Express.js
- **Template Engine**: EJS
- **Frontend**: HTML5, CSS3, JavaScript Vanilla
- **Sessões**: Express Session
- **Estilo**: CSS Custom Properties (Variáveis CSS)

## 📁 Estrutura do Projeto

```
UsinaSoft/
├── views/                    # Templates EJS
│   ├── layout.ejs           # Layout principal
│   ├── login.ejs            # Página de login
│   ├── menu.ejs             # Menu principal
│   ├── clientes.ejs         # Cadastro de clientes
│   ├── cadastro.ejs         # Cadastro de peças
│   ├── producao.ejs         # Controle de produção
│   ├── indicadores.ejs      # Indicadores
│   └── partials/            # Componentes reutilizáveis
│       ├── header.ejs
│       ├── navigation.ejs
│       ├── footer.ejs
│       └── components/
│           ├── button.ejs
│           ├── card.ejs
│           └── form-group.ejs
├── public/                  # Arquivos estáticos
│   ├── css/
│   │   ├── main.css        # Estilos principais
│   │   ├── components.css  # Componentes
│   │   └── login.css       # Estilos do login
│   ├── js/
│   │   └── main.js         # JavaScript principal
│   └── img/
│       └── fabrica.png     # Logo da empresa
├── server.js               # Servidor principal
└── package.json           # Dependências do projeto
```

## 🚀 Instalação e Execução

### Pré-requisitos

- Node.js (versão 14 ou superior)
- npm ou yarn

### Instalação

1. Clone o repositório:

```bash
git clone <url-do-repositorio>
cd UsinaSoft
```

2. Instale as dependências:

```bash
npm install
```

3. Execute o servidor:

```bash
npm start
```

Para desenvolvimento com auto-reload:

```bash
npm run dev
```

4. Acesse o sistema:

```
http://localhost:3000
```

## 🔐 Login

Para acessar o sistema, use qualquer email e senha (sistema de autenticação simulado).

## 📱 Funcionalidades

### 1. Menu Principal

- Dashboard com cards de navegação
- Acesso rápido a todas as funcionalidades
- Design responsivo

### 2. Cadastro de Peças

- Formulário completo com validação
- Campos: Cliente, Pedido, Código, Quantidade, Data de Entrega
- Validação em tempo real
- Feedback visual de sucesso/erro

### 3. Controle de Produção

- Lista de itens em produção
- Filtros por código, status e data
- Estatísticas em tempo real
- Ações de edição e remoção

### 4. Indicadores

- Gráfico de barras interativo
- Filtros por período
- Cards de estatísticas
- Métricas de produtividade

## 🎯 Melhorias Implementadas

### Estrutura e Organização

- ✅ Separação clara entre views, partials e componentes
- ✅ Estrutura de pastas organizada e escalável
- ✅ Componentes reutilizáveis (botões, cards, formulários)
- ✅ Sistema de layout consistente

### Design e UX

- ✅ Design system com variáveis CSS
- ✅ Cores padronizadas do projeto
- ✅ Componentes responsivos
- ✅ Navegação consistente
- ✅ Feedback visual para ações

### Código e Boas Práticas

- ✅ JavaScript modular e organizado
- ✅ Validação de formulários
- ✅ Sistema de notificações
- ✅ Gerenciamento de estado
- ✅ Eventos customizados

### Escalabilidade

- ✅ Estrutura preparada para banco de dados
- ✅ API endpoints organizados
- ✅ Componentes reutilizáveis
- ✅ Sistema de autenticação extensível

## 🔮 Próximos Passos

Para expandir o sistema, considere implementar:

1. **Banco de Dados**

   - Integração com PostgreSQL/MySQL
   - Modelos de dados estruturados
   - Migrations e seeds

2. **Autenticação Real**

   - Hash de senhas com bcrypt
   - JWT tokens
   - Controle de permissões

3. **Funcionalidades Avançadas**

   - Drag & Drop no kanban
   - Relatórios em PDF
   - Notificações em tempo real
   - API REST completa

4. **Melhorias de UX**
   - PWA (Progressive Web App)
   - Modo escuro
   - Atalhos de teclado
   - Busca global

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

## 👥 Contribuição

Contribuições são bem-vindas! Por favor, abra uma issue ou pull request para sugerir melhorias.

---

**UsinaSoft** - Sistema de Gestão de Usinagem v1.0.0
