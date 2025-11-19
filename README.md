# SIGLS - Sistema de Gerenciamento de Locais de Saúde de Corumbá (MS)

Sistema Full-Stack para visualização pública em mapa e gerenciamento administrativo de unidades de saúde, médicos e especialidades no município de Corumbá, MS.

## 🏗️ Arquitetura

- **Monorepo**: Estrutura modular com workspaces npm
- **Backend API**: Node.js + Express + JWT + RBAC
- **ETL Worker**: Pipeline automatizado com validação humana (PostgreSQL → MySQL)
- **Frontend**: React + Redux Toolkit + Ant Design + React Leaflet
- **Database**: MySQL (destino) + PostgreSQL (fonte) + Prisma ORM

## 📦 Estrutura do Projeto

```
sigls-monorepo/
├── apps/
│   ├── api/              # Backend API (Express)
│   ├── etl-worker/       # ETL Worker (Node.js)
│   └── web/              # Frontend (React)
├── packages/
│   ├── database/         # Prisma Schema & Migrations
│   ├── shared/           # Tipos e utilitários compartilhados
│   └── logger/           # Sistema de logs estruturados
└── scripts/              # Scripts utilitários
```

## 🚀 Início Rápido

### 1. Instalação

```bash
# Instalar dependências
npm install

# Copiar arquivo de ambiente
copy .env.example .env

# Editar .env com suas credenciais de banco de dados
```

### 2. Configuração do Banco de Dados

```bash
# Gerar cliente Prisma
npm run prisma:generate

# Executar migrations
npm run prisma:migrate

# (Opcional) Abrir Prisma Studio
npm run prisma:studio
```

### 3. Criar Superadmin

```bash
npm run create:superadmin
```

### 4. Executar em Desenvolvimento

```bash
# Terminal 1 - API
npm run dev:api

# Terminal 2 - ETL Worker
npm run dev:worker

# Terminal 3 - Frontend
npm run dev:web
```

## 🔐 Controle de Acesso (RBAC)

### Papéis

- **Admin**: CRUD em dados validados, validação e enriquecimento de staging
- **Superadmin**: Todas as permissões de Admin + gerenciamento de usuários + acesso total a logs

### Autenticação

O sistema usa JWT (JSON Web Tokens) para autenticação stateless. O token contém o `role` do usuário no payload.

## 🔄 Pipeline ETL

### Fluxo de Trabalho

1. **Extract**: Worker extrai dados da Base da Saúde (fonte)
2. **Transform**: Limpeza e padronização (UPPER, DISTINCT)
3. **Load**: Carrega em `STAGING_Info_Origem` com status 'pendente'
4. **Validação Humana**: Admin valida e enriquece dados (Lat/Lng, nome familiar)
5. **Promoção**: Dados validados são promovidos para tabelas PROD

### Sincronização

- **UPSERT**: Baseado em `id_origem` para sincronização incremental
- **Bulk Insert**: Transações otimizadas para múltiplos registros
- **Agendamento**: Execução automática via cron (configurável)

## 🗺️ Sistema de Mapas

### Configuração Geográfica

- **Área**: Município de Corumbá, MS
- **Bounding Box**:
  - SouthWest: Lat -22.0, Lng -60.5
  - NorthEast: Lat -16.0, Lng -56.0
- **Centro**: Lat -19.008, Lng -57.651
- **Restrição**: `maxBounds` com `maxBoundsViscosity: 1.0`

## 📊 Auditoria

### Audit Trail

- **Triggers MySQL**: Capturam INSERT, UPDATE, DELETE em tabelas PROD
- **Registro Imutável**: Estado anterior e novo (JSON) em `AUDIT_LOG`
- **Metadados**: user_id, role, timestamp, correlation_id

### Logs de Aplicação

- **Formato**: JSON estruturado (Winston/Pino)
- **Níveis**: error, warn, info, debug
- **Contexto**: user_id, role, correlation_id em cada log

## 🛠️ Scripts Úteis

```bash
# Desenvolvimento
npm run dev:api          # Inicia API
npm run dev:worker       # Inicia ETL Worker
npm run dev:web          # Inicia Frontend

# Build
npm run build:api        # Build API
npm run build:worker     # Build Worker
npm run build:web        # Build Frontend

# Database
npm run prisma:generate  # Gera cliente Prisma
npm run prisma:migrate   # Executa migrations
npm run prisma:studio    # Abre Prisma Studio

# Utilitários
npm run create:superadmin  # Cria usuário superadmin
```

## 📝 Variáveis de Ambiente

Consulte `.env.example` para todas as variáveis disponíveis.

### Essenciais

- `DATABASE_URL`: Conexão MySQL (SIGLS - Destino)
- `SOURCE_DATABASE_URL`: Conexão MySQL (Base da Saúde - Fonte)
- `JWT_SECRET`: Chave secreta para JWT
- `API_PORT`: Porta da API (padrão: 3001)

## 🔒 Segurança

- ✅ JWT para autenticação stateless
- ✅ bcryptjs para hash de senhas
- ✅ Helmet para headers HTTP seguros
- ✅ RBAC para controle de acesso granular
- ✅ Validação de entrada em todas as rotas
- ✅ Connection pooling para performance
- ✅ Prepared statements (Prisma) contra SQL injection

## 📚 Tecnologias Principais

### Backend
- Node.js + Express
- Prisma ORM
- JWT + bcryptjs
- Winston (Logging)
- Helmet (Security)

### Frontend
- React 18
- Redux Toolkit + RTK Query
- Ant Design
- React Leaflet
- React Hook Form

### Database
- MySQL 8+
- Prisma Migrations

## 🤝 Contribuindo

Este é um projeto da Prefeitura de Corumbá. Para contribuir, entre em contato com a equipe de desenvolvimento.

## 📄 Licença

MIT License - veja o arquivo LICENSE para detalhes.
