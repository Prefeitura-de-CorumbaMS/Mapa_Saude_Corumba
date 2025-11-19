# Changelog - Adaptação para PostgreSQL

## 🔄 Mudanças Implementadas

### Arquivos Modificados

#### 1. `apps/etl-worker/package.json`
- ❌ Removido: `mysql2` (driver MySQL)
- ✅ Adicionado: `pg` (driver PostgreSQL)

#### 2. `apps/etl-worker/src/extract.js`
**Mudanças principais:**

- **Import:**
  ```javascript
  // Antes
  const mysql = require('mysql2/promise');
  
  // Depois
  const { Pool } = require('pg');
  ```

- **Conexão:**
  ```javascript
  // Antes: Connection única
  mysql.createConnection(url)
  
  // Depois: Pool de conexões
  new Pool({ connectionString: url, max: 5 })
  ```

- **Query:**
  ```javascript
  // Antes (MySQL)
  const [rows] = await connection.execute(query);
  
  // Depois (PostgreSQL)
  const result = await pool.query(query);
  return result.rows;
  ```

- **Streaming/Cursor:**
  - MySQL usava `.stream()`
  - PostgreSQL usa `CURSOR` com `BEGIN/COMMIT`

- **Sintaxe SQL:**
  ```sql
  -- Antes (MySQL)
  WHERE ativo = 1
  
  -- Depois (PostgreSQL)
  WHERE ativo = TRUE
  ```

#### 3. `.env.example`
```env
# Antes
SOURCE_DATABASE_URL="mysql://user:password@host:3306/base_saude"

# Depois
SOURCE_DATABASE_URL="postgresql://user:password@host:5432/base_saude"
```

#### 4. Documentação
- ✅ `SETUP.md` - Atualizado pré-requisitos e exemplos
- ✅ `README.md` - Atualizado arquitetura
- ✅ `docs/ETL-POSTGRESQL.md` - **NOVO** - Guia completo PostgreSQL

## 🎯 O Que Você Precisa Fazer

### 1. Reinstalar Dependências

```bash
cd apps/etl-worker
npm install
```

Isso instalará o driver `pg` ao invés do `mysql2`.

### 2. Configurar Connection String

No arquivo `.env`, configure a conexão PostgreSQL:

```env
SOURCE_DATABASE_URL="postgresql://usuario:senha@host:5432/base_saude"
```

**Exemplos:**

```env
# Local
SOURCE_DATABASE_URL="postgresql://postgres:senha@localhost:5432/base_saude"

# Remoto
SOURCE_DATABASE_URL="postgresql://user:pass@192.168.1.100:5432/base_saude"

# Com SSL
SOURCE_DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"
```

### 3. Ajustar Query de Extração

Edite `apps/etl-worker/src/extract.js` (linha 29):

```javascript
const EXTRACTION_QUERY = `
  SELECT 
    sua_coluna_id AS id_origem,
    nome_profissional AS nome_medico,
    nome_estabelecimento AS nome_unidade,
    especialidade AS nome_especialidade
  FROM sua_tabela_ou_view
  WHERE ativo = TRUE  -- PostgreSQL usa TRUE/FALSE
  ORDER BY id_origem
`;
```

## ✅ Vantagens da Mudança

1. **Compatibilidade:** Agora funciona com PostgreSQL (fonte real)
2. **Performance:** Pool de conexões otimizado
3. **Cursor:** Suporte a grandes volumes com baixo uso de memória
4. **Transacional:** Extração com cursor usa BEGIN/COMMIT

## 📊 Comparação: MySQL vs PostgreSQL

| Aspecto | MySQL (antes) | PostgreSQL (agora) |
|---------|---------------|-------------------|
| Driver | `mysql2` | `pg` |
| Conexão | Connection | Pool |
| Porta padrão | 3306 | 5432 |
| Booleano | `1` / `0` | `TRUE` / `FALSE` |
| Streaming | `.stream()` | `CURSOR` |
| Schema | Não usa | Suporta nativamente |

## 🔍 Verificar Mudanças

### Testar Conexão PostgreSQL

Crie `test-connection.js`:

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.SOURCE_DATABASE_URL
});

async function test() {
  try {
    const result = await pool.query('SELECT NOW(), version()');
    console.log('✅ PostgreSQL conectado!');
    console.log('Hora:', result.rows[0].now);
    console.log('Versão:', result.rows[0].version);
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

test();
```

Execute:
```bash
node test-connection.js
```

## 📚 Documentação Adicional

Consulte o guia completo: **[docs/ETL-POSTGRESQL.md](./docs/ETL-POSTGRESQL.md)**

Inclui:
- Exemplos de queries PostgreSQL
- Configuração de SSL
- Troubleshooting
- Boas práticas de segurança
- Otimização de performance

## ⚠️ Notas Importantes

1. **Banco SIGLS (destino) continua MySQL** - Apenas a fonte mudou para PostgreSQL
2. **Prisma continua usando MySQL** - Nenhuma mudança no schema
3. **API não foi afetada** - Continua usando MySQL via Prisma
4. **Frontend não foi afetado** - Nenhuma mudança necessária

## 🆘 Problemas Comuns

### "Cannot find module 'pg'"
```bash
npm install
```

### "Connection refused"
- Verificar se PostgreSQL está rodando
- Verificar firewall/porta 5432
- Verificar `pg_hba.conf`

### "SSL required"
Adicionar na connection string:
```
?sslmode=require
```

## ✨ Próximos Passos

1. ✅ Instalar dependências: `npm install`
2. ✅ Configurar `.env` com PostgreSQL
3. ✅ Ajustar query de extração
4. ✅ Testar conexão
5. ✅ Executar ETL Worker: `npm run dev:worker`
