# 📋 PLANEJAMENTO: Sistema de Gerenciamento de Usuários

## 📊 Situação Atual

### ✅ O que já existe:
1. **Backend (API)** - `apps/api/src/routes/user.routes.js`
   - ✅ GET /api/users - Lista usuários
   - ✅ GET /api/users/:id - Busca por ID
   - ✅ POST /api/users - Criar usuário
   - ✅ PUT /api/users/:id - Atualizar usuário
   - ✅ DELETE /api/users/:id - Deletar usuário
   - ✅ Todas rotas protegidas por `requireSuperadmin`
   - ✅ Auditoria integrada com `auditLog()`

2. **Frontend** - `apps/web/src/pages/admin/UsersPage.jsx`
   - ⚠️ Apenas visualização (tabela simples)
   - ❌ Sem formulário de criação
   - ❌ Sem ações de edição/exclusão
   - ❌ Sem modal de detalhes

3. **Database**
   - ✅ Tabela User com todos campos necessários
   - ✅ Enum UserRole (admin, superadmin)
   - ✅ Campo ativo para soft delete
   - ✅ Campos created_at, updated_at, last_login

4. **Sistema de Auditoria**
   - ✅ Tabela AUDIT_LOG funcionando
   - ✅ Página /admin/audit exibindo logs
   - ✅ Backend chamando auditLog() nas operações de User
   - ✅ Triggers automáticos para outras tabelas

---

## 🎯 Objetivos da Implementação

### 1. **Página de Gerenciamento de Usuários Completa**
   - CRUD completo via interface
   - Modal para criar/editar usuários
   - Confirmação para exclusão
   - Indicadores visuais de status

### 2. **Melhorias na Página de Auditoria**
   - Filtros por tabela, operação, usuário, data
   - Visualização detalhada do diff (valor_antigo vs valor_novo)
   - Exportação de logs
   - Estatísticas visuais

### 3. **Segurança e Permissões**
   - Prevenir que admin delete a si mesmo
   - Prevenir que admin altere própria role
   - Validações robustas no frontend e backend

---

## 🛠️ Implementação Detalhada

### FASE 1: Melhorar UsersPage (Frontend)

#### 📝 Arquivo: `apps/web/src/pages/admin/UsersPage.jsx`

**Funcionalidades a implementar:**

1. **Botão "Novo Usuário"** no topo
   - Abre modal com formulário

2. **Formulário de Criação/Edição**
   - Campos:
     - Username (obrigatório, único)
     - Email (obrigatório, único, validação de formato)
     - Password (obrigatório na criação, opcional na edição)
     - Confirmar Password
     - Role (select: admin/superadmin)
     - Status Ativo (switch)
   - Validações:
     - Username: mínimo 3 caracteres, sem espaços
     - Email: formato válido
     - Password: mínimo 8 caracteres, 1 letra, 1 número
     - Senhas devem coincidir

3. **Tabela com ações**
   - Coluna "Ações" com botões:
     - 🔍 Ver Detalhes
     - ✏️ Editar
     - 🗑️ Excluir (com confirmação)
   - Indicador visual:
     - Badge "VOCÊ" para usuário logado
     - Desabilitar edição/exclusão do próprio usuário

4. **Modal de Detalhes**
   - Informações completas do usuário
   - Histórico de últimos logins
   - Estatísticas de ações (buscar no AUDIT_LOG)

**Componentes Ant Design a usar:**
- Table
- Modal
- Form
- Input, Input.Password
- Select
- Switch
- Button
- Popconfirm (para exclusão)
- Tabs (no modal de detalhes)
- Descriptions
- Tag
- Space

---

### FASE 2: Melhorar AuditPage (Frontend)

#### 📝 Arquivo: `apps/web/src/pages/admin/AuditPage.jsx`

**Funcionalidades a implementar:**

1. **Filtros Avançados**
   ```jsx
   Filtros:
   - Tabela: Select com todas tabelas
   - Operação: Select (INSERT, UPDATE, DELETE)
   - Usuário: Select com lista de users
   - Data Início: DatePicker
   - Data Fim: DatePicker
   - Botão "Filtrar" e "Limpar"
   ```

2. **Tabela Expandível**
   - Expandir linha para ver diff detalhado
   - Componente visual mostrando:
     - Valor Antigo (vermelho/tachado)
     - Valor Novo (verde/destacado)
   - Formato JSON prettify

3. **Estatísticas no Topo**
   - Cards com:
     - Total de operações (hoje, semana, mês)
     - Operações por tipo (INSERT/UPDATE/DELETE)
     - Usuários mais ativos
     - Tabelas mais modificadas

4. **Exportação**
   - Botão "Exportar para CSV"
   - Botão "Exportar para JSON"
   - Incluir filtros aplicados

**Componentes Ant Design a usar:**
- Card
- Statistic
- DatePicker.RangePicker
- Collapse
- Descriptions
- Badge
- Tooltip

---

### FASE 3: Aprimorar Backend (Opcional)

#### 📝 Arquivo: `apps/api/src/routes/audit.routes.js`

**Melhorias:**

1. **Novos endpoints:**
   ```javascript
   GET /api/audit/user/:userId/actions
   // Retorna ações de um usuário específico
   
   GET /api/audit/record/:table/:id/history
   // Retorna histórico completo de um registro
   
   GET /api/audit/stats/dashboard
   // Estatísticas para dashboard
   
   GET /api/audit/export?format=csv|json
   // Exporta logs com filtros aplicados
   ```

2. **Validações adicionais em User routes:**
   - Prevenir email duplicado
   - Prevenir username duplicado
   - Senha forte (regex)
   - Não permitir alterar própria role

---

## 📐 Estrutura de Componentes

### UsersPage.jsx (completo)
```
UsersPage/
├── Header
│   ├── Título
│   └── Botão "Novo Usuário"
├── Filtros (opcional)
│   ├── Busca por nome/email
│   └── Filtro por role/status
├── Table
│   ├── Colunas padrão
│   └── Coluna Ações
├── UserFormModal
│   ├── Form Fields
│   ├── Validações
│   └── Botões Salvar/Cancelar
├── UserDetailModal
│   ├── Tabs
│   │   ├── Informações
│   │   ├── Histórico
│   │   └── Estatísticas
│   └── Botão Fechar
└── DeleteConfirm (Popconfirm)
```

### AuditPage.jsx (completo)
```
AuditPage/
├── Header
│   ├── Título
│   └── Botão "Exportar"
├── StatsCards
│   ├── Total Operações
│   ├── Por Tipo
│   ├── Usuários Ativos
│   └── Tabelas Modificadas
├── Filtros
│   ├── Tabela
│   ├── Operação
│   ├── Usuário
│   ├── Range de Data
│   └── Botões Aplicar/Limpar
├── Table
│   ├── Colunas padrão
│   └── Linha Expandível (diff)
└── AuditDiffViewer
    ├── Valor Antigo (lado esquerdo)
    └── Valor Novo (lado direito)
```

---

## 🔐 Regras de Negócio

### Permissões:
1. **Superadmin:**
   - ✅ Criar/editar/deletar qualquer usuário
   - ✅ Ver todos logs de auditoria
   - ✅ Exportar dados

2. **Admin:**
   - ❌ Não pode acessar UsersPage
   - ✅ Pode ver audit logs (filtrado?)
   - ✅ Pode gerenciar todas outras entidades

### Restrições:
1. ❌ Não pode deletar próprio usuário
2. ❌ Não pode alterar própria role
3. ❌ Deve ter pelo menos 1 superadmin ativo
4. ⚠️ Avisar antes de deletar usuário com histórico

---

## 📦 Dependências Necessárias

Todas já instaladas:
- ✅ antd (componentes UI)
- ✅ dayjs (formatação de datas)
- ✅ RTK Query (gerenciamento de API)
- ✅ react-router-dom (navegação)

---

## 🎨 Design System (Ant Design)

### Cores para Tags:
- **Role:**
  - superadmin: `red`
  - admin: `blue`

- **Status:**
  - Ativo: `green`
  - Inativo: `gray`

- **Operações:**
  - INSERT: `green`
  - UPDATE: `blue`
  - DELETE: `red`

### Ícones:
- Novo Usuário: `UserAddOutlined`
- Editar: `EditOutlined`
- Deletar: `DeleteOutlined`
- Ver: `EyeOutlined`
- Filtro: `FilterOutlined`
- Exportar: `DownloadOutlined`
- Estatísticas: `BarChartOutlined`

---

## 📝 Checklist de Implementação

### UsersPage:
- [ ] Criar componente UserFormModal
- [ ] Implementar validações no formulário
- [ ] Adicionar coluna Ações na tabela
- [ ] Implementar criação de usuário
- [ ] Implementar edição de usuário
- [ ] Implementar exclusão com confirmação
- [ ] Criar modal de detalhes do usuário
- [ ] Buscar estatísticas do usuário no AUDIT_LOG
- [ ] Adicionar indicador "VOCÊ" para usuário logado
- [ ] Prevenir ações no próprio usuário

### AuditPage:
- [ ] Criar componente de filtros
- [ ] Implementar filtros na query
- [ ] Adicionar cards de estatísticas
- [ ] Criar componente AuditDiffViewer
- [ ] Implementar expansão de linhas
- [ ] Adicionar exportação CSV
- [ ] Adicionar exportação JSON
- [ ] Melhorar formatação de datas
- [ ] Adicionar tooltips informativos

### Backend (opcional):
- [ ] Criar endpoint /api/audit/user/:userId/actions
- [ ] Criar endpoint /api/audit/record/:table/:id/history
- [ ] Criar endpoint /api/audit/stats/dashboard
- [ ] Criar endpoint /api/audit/export
- [ ] Adicionar validação de email único
- [ ] Adicionar validação de username único
- [ ] Adicionar validação de senha forte

---

## 🚀 Ordem de Implementação Sugerida

### Prioridade 1 (Essencial):
1. **UsersPage - CRUD Básico**
   - Formulário de criação
   - Edição
   - Exclusão com confirmação

### Prioridade 2 (Importante):
2. **UsersPage - Validações e Segurança**
   - Validações no formulário
   - Prevenir ações no próprio usuário
   - Indicador "VOCÊ"

3. **AuditPage - Filtros Básicos**
   - Filtro por tabela
   - Filtro por operação
   - Filtro por data

### Prioridade 3 (Desejável):
4. **UsersPage - Detalhes e Estatísticas**
   - Modal de detalhes
   - Histórico de ações

5. **AuditPage - Visualização Avançada**
   - Diff viewer
   - Estatísticas no topo

### Prioridade 4 (Adicional):
6. **AuditPage - Exportação**
   - Exportar CSV
   - Exportar JSON

7. **Backend - Endpoints Extras**
   - Estatísticas avançadas
   - Histórico detalhado

---

## 💡 Observações Importantes

1. **Auditoria já funciona!**
   - Quando você criar/editar/deletar usuário via API
   - O backend já chama `auditLog()` automaticamente
   - Os registros aparecem em /admin/audit
   - O user_id fica preenchido (não é NULL como nos triggers)

2. **Diferença: API vs Triggers**
   - Ações via API: tem `user_id` (quem fez)
   - Ações via Trigger: `user_id` NULL (sistema)
   - Isso permite distinguir ações manuais de automáticas

3. **Segurança**
   - Todas rotas já estão protegidas com `requireSuperadmin`
   - Apenas superadmin pode gerenciar usuários
   - Validações no backend previnem inconsistências

4. **Escalabilidade**
   - Sistema pronto para múltiplos admins
   - Auditoria rastreia quem fez o quê
   - Fácil adicionar níveis de permissão no futuro

---

## 🎯 Resultado Final Esperado

### Para o Usuário:
- Interface intuitiva para gerenciar usuários
- Visualização clara de quem fez cada alteração
- Histórico completo de ações no sistema
- Segurança contra ações acidentais

### Para o Sistema:
- Rastreabilidade completa
- Auditoria imutável
- Conformidade com boas práticas
- Base sólida para futuras expansões

---

## 📞 Próximos Passos

Qual prioridade você quer implementar primeiro?

1. **UsersPage completo** (CRUD + validações)
2. **AuditPage com filtros** (melhor visualização)
3. **Ambos simultaneamente** (trabalho maior)

Posso gerar o código completo para qualquer uma dessas opções!
