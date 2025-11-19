# ETL Worker - Integração com PostgreSQL

## 📊 Visão Geral

O ETL Worker do SIGLS extrai dados de uma **Base da Saúde em PostgreSQL** (fonte) e carrega no **banco MySQL do SIGLS** (destino).

## 🔌 Configuração da Conexão

### Connection String PostgreSQL

No arquivo `.env`, configure:

```env
SOURCE_DATABASE_URL="postgresql://usuario:senha@host:5432/base_saude"
```

### Formato Completo

```
postgresql://[usuario]:[senha]@[host]:[porta]/[database]?[parametros]
```

**Exemplos:**

```env
# Conexão local
SOURCE_DATABASE_URL="postgresql://postgres:senha123@localhost:5432/base_saude"

# Conexão remota
SOURCE_DATABASE_URL="postgresql://user:pass@192.168.1.100:5432/base_saude"

# Com SSL
SOURCE_DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"

# Com schema específico
SOURCE_DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public"
```

## 🔧 Ajustar Query de Extração

Edite o arquivo `apps/etl-worker/src/extract.js`:

```javascript
const EXTRACTION_QUERY = `
  SELECT 
    id_origem,
    nome_medico,
    nome_unidade,
    nome_especialidade
  FROM sua_view_ou_tabela
  WHERE ativo = TRUE  -- PostgreSQL usa TRUE/FALSE
  ORDER BY id_origem
`;
```

### Diferenças de Sintaxe PostgreSQL vs MySQL

| Recurso | PostgreSQL | MySQL |
|---------|------------|-------|
| Booleano | `TRUE` / `FALSE` | `1` / `0` ou `TRUE` / `FALSE` |
| String concat | `\|\|` ou `CONCAT()` | `CONCAT()` |
| Limit | `LIMIT n OFFSET m` | `LIMIT m, n` |
| Case sensitive | Sim (por padrão) | Não (por padrão) |
| Aspas | `"coluna"` (identifiers) | `` `coluna` `` |
| Schemas | Suportado nativamente | Não (usa databases) |

## 📝 Exemplos de Queries PostgreSQL

### Query Básica

```sql
SELECT 
  cnes_id AS id_origem,
  nome_profissional AS nome_medico,
  nome_estabelecimento AS nome_unidade,
  especialidade AS nome_especialidade
FROM public.profissionais_saude
WHERE ativo = TRUE
  AND data_atualizacao >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY cnes_id;
```

### Query com JOIN

```sql
SELECT 
  e.cnes AS id_origem,
  p.nome AS nome_medico,
  e.nome_fantasia AS nome_unidade,
  esp.descricao AS nome_especialidade
FROM estabelecimentos e
INNER JOIN profissionais p ON p.estabelecimento_id = e.id
INNER JOIN especialidades esp ON esp.id = p.especialidade_id
WHERE e.municipio = 'CORUMBÁ'
  AND e.ativo = TRUE
  AND p.ativo = TRUE;
```

### Query com COALESCE (valores padrão)

```sql
SELECT 
  COALESCE(cnes, cpf) AS id_origem,
  UPPER(TRIM(nome)) AS nome_medico,
  COALESCE(nome_fantasia, razao_social) AS nome_unidade,
  especialidade AS nome_especialidade
FROM profissionais_view
WHERE municipio_ibge = '5003207'  -- Código IBGE de Corumbá
  AND situacao = 'ATIVO';
```

## 🚀 Métodos de Extração

### 1. Extração Simples (padrão)

Para volumes pequenos/médios (até 100k registros):

```javascript
const records = await extractFromSource();
```

**Características:**
- Carrega todos os registros em memória
- Mais rápido para volumes pequenos
- Usa `pool.query()`

### 2. Extração com Cursor (grandes volumes)

Para volumes grandes (milhões de registros):

```javascript
await extractFromSourceStreaming(async (batch) => {
  // Processar lote
  await processarLote(batch);
});
```

**Características:**
- Usa PostgreSQL CURSOR
- Processa em lotes (batch)
- Baixo uso de memória
- Transacional (BEGIN/COMMIT)

## ⚙️ Configurações de Performance

### Pool de Conexões

No arquivo `extract.js`, ajuste conforme necessário:

```javascript
return new Pool({
  connectionString: process.env.SOURCE_DATABASE_URL,
  max: 5,                      // Máximo de conexões simultâneas
  idleTimeoutMillis: 30000,    // Timeout de conexão ociosa (30s)
  connectionTimeoutMillis: 10000, // Timeout de conexão (10s)
});
```

### Tamanho do Lote

No arquivo `.env`:

```env
ETL_BATCH_SIZE=1000  # Registros por lote (padrão: 1000)
```

**Recomendações:**
- 500-1000: Volumes pequenos
- 1000-5000: Volumes médios
- 5000-10000: Volumes grandes com boa rede

## 🔍 Troubleshooting

### Erro: "Connection refused"

**Causa:** PostgreSQL não está acessível

**Solução:**
1. Verificar se PostgreSQL está rodando
2. Verificar firewall/porta 5432
3. Verificar `pg_hba.conf` para permitir conexão remota

### Erro: "password authentication failed"

**Causa:** Credenciais incorretas

**Solução:**
1. Verificar usuário e senha no `.env`
2. Verificar se usuário tem permissões no banco

### Erro: "relation does not exist"

**Causa:** Tabela/view não existe ou está em schema diferente

**Solução:**
1. Verificar nome da tabela/view
2. Especificar schema: `schema_name.table_name`
3. Adicionar schema na connection string: `?schema=public`

### Erro: "SSL connection required"

**Causa:** Servidor PostgreSQL requer SSL

**Solução:**
Adicionar parâmetro SSL na connection string:

```env
SOURCE_DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"
```

Opções de `sslmode`:
- `disable`: Sem SSL
- `prefer`: Tenta SSL, fallback sem SSL
- `require`: Requer SSL
- `verify-ca`: Requer SSL + verifica CA
- `verify-full`: Requer SSL + verifica CA + hostname

## 📊 Monitoramento

### Logs do ETL

Os logs mostram informações sobre a conexão PostgreSQL:

```
[INFO] Connecting to source database (PostgreSQL)
[INFO] Executing extraction query
[INFO] Extraction completed { records_extracted: 1234 }
[INFO] Source database connection pool closed
```

### Verificar Execuções

No painel admin, acesse **ETL > Execuções** para ver:
- Status das execuções
- Registros extraídos
- Registros carregados
- Erros (se houver)

## 🔐 Segurança

### Boas Práticas

1. **Usuário com Permissões Mínimas:**
   ```sql
   CREATE USER etl_reader WITH PASSWORD 'senha_forte';
   GRANT CONNECT ON DATABASE base_saude TO etl_reader;
   GRANT USAGE ON SCHEMA public TO etl_reader;
   GRANT SELECT ON ALL TABLES IN SCHEMA public TO etl_reader;
   ```

2. **Usar SSL em Produção:**
   ```env
   SOURCE_DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"
   ```

3. **Não Commitar Credenciais:**
   - Sempre use `.env` (não versionado)
   - Use secrets manager em produção

## 🧪 Testar Conexão

Crie um script de teste `test-pg-connection.js`:

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://user:pass@host:5432/db'
});

async function test() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Conexão OK:', result.rows[0]);
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
node test-pg-connection.js
```

## 📚 Recursos Adicionais

- [Documentação pg (node-postgres)](https://node-postgres.com/)
- [PostgreSQL Connection Strings](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING)
- [PostgreSQL CURSOR](https://www.postgresql.org/docs/current/plpgsql-cursors.html)
