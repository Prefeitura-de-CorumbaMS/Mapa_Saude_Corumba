# Guia de Deploy - Mapa de Saúde Corumbá

Este guia descreve como fazer o deploy do frontend e backend em produção.

## Arquitetura de Deploy

- **Frontend**: Nginx na porta 8005 (arquivos estáticos)
- **Backend (API)**: Node.js na porta 8006
- **Banco de Dados**: MySQL na porta 3306

## Pré-requisitos

1. Node.js v18+ instalado
2. Nginx instalado
3. MySQL configurado
4. PM2 instalado globalmente: `npm install -g pm2`

## Passo 1: Configurar Variáveis de Ambiente

Edite o arquivo `.env` na raiz do projeto com as configurações de produção:

```env
# API Configuration
API_PORT=8006
NODE_ENV="production"

# Frontend Configuration
VITE_API_URL="http://seu-dominio.com/api"
FRONTEND_URL="http://seu-dominio.com"

# Database Configuration
DB_HOST="172.16.0.117"
DB_PORT="3306"
DB_NAME="sigls_db"
DB_USER="seu_usuario"
DB_PASSWORD="sua_senha"

# ... (resto das configurações)
```

## Passo 2: Gerar Build do Frontend

```bash
# Gerar build de produção
npm run build:web

# Verificar se o build foi gerado
ls -lh apps/web/dist/
```

O build será gerado em `apps/web/dist/`.

## Passo 3: Configurar Nginx

### Opção 1: Script Automatizado (Recomendado)

```bash
sudo bash scripts/deploy-frontend.sh
```

### Opção 2: Configuração Manual

```bash
# 1. Copiar configuração
sudo cp nginx.conf /etc/nginx/sites-available/mapasaude

# 2. Criar link simbólico
sudo ln -s /etc/nginx/sites-available/mapasaude /etc/nginx/sites-enabled/

# 3. Testar configuração
sudo nginx -t

# 4. Recarregar Nginx
sudo systemctl reload nginx
```

## Passo 4: Configurar API com PM2

```bash
# 1. Criar arquivo de configuração do PM2
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'mapasaude-api',
      cwd: '/home/elizael/Mapa_Saude_Corumba',
      script: 'apps/api/src/index.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
EOF

# 2. Iniciar API com PM2
pm2 start ecosystem.config.js

# 3. Salvar configuração do PM2
pm2 save

# 4. Configurar PM2 para iniciar no boot
pm2 startup
# Execute o comando que o PM2 mostrar

# 5. Verificar status
pm2 status
pm2 logs mapasaude-api
```

## Passo 5: Configurar Firewall (se necessário)

```bash
# Permitir tráfego nas portas 8005 (Nginx) e 8006 (API)
sudo ufw allow 8005/tcp
sudo ufw allow 8006/tcp
sudo ufw reload
```

## Passo 6: Verificar Funcionamento

1. **Verificar Nginx**:
   ```bash
   curl http://localhost:8005
   ```

2. **Verificar API**:
   ```bash
   curl http://localhost:8006/health
   ```

3. **Verificar logs do Nginx**:
   ```bash
   sudo tail -f /var/log/nginx/mapasaude_access.log
   sudo tail -f /var/log/nginx/mapasaude_error.log
   ```

4. **Verificar logs da API**:
   ```bash
   pm2 logs mapasaude-api
   ```

## Comandos Úteis

### PM2 (API)

```bash
# Ver status
pm2 status

# Ver logs em tempo real
pm2 logs mapasaude-api

# Reiniciar
pm2 restart mapasaude-api

# Parar
pm2 stop mapasaude-api

# Monitorar recursos
pm2 monit
```

### Nginx (Frontend)

```bash
# Recarregar configuração
sudo systemctl reload nginx

# Reiniciar Nginx
sudo systemctl restart nginx

# Ver status
sudo systemctl status nginx

# Testar configuração
sudo nginx -t
```

### Atualizar Build do Frontend

```bash
# 1. Gerar novo build
npm run build:web

# 2. Limpar cache do Nginx (opcional)
sudo rm -rf /var/cache/nginx/*

# 3. Recarregar Nginx
sudo systemctl reload nginx
```

### Atualizar API

```bash
# 1. Atualizar código (git pull, etc.)
git pull

# 2. Instalar dependências (se necessário)
npm install

# 3. Reiniciar API
pm2 restart mapasaude-api
```

## Troubleshooting

### Frontend não carrega

1. Verificar se o Nginx está rodando: `sudo systemctl status nginx`
2. Verificar logs: `sudo tail -f /var/log/nginx/mapasaude_error.log`
3. Verificar se o build existe: `ls -lh apps/web/dist/`
4. Testar configuração: `sudo nginx -t`

### API não responde

1. Verificar se o PM2 está rodando: `pm2 status`
2. Verificar logs: `pm2 logs mapasaude-api`
3. Verificar se a porta 8006 está em uso: `lsof -i :8006`
4. Verificar variáveis de ambiente no `.env`

### Imagens não carregam

1. Verificar se a pasta `uploads/` existe e tem permissões corretas
2. Verificar proxy do Nginx para `/uploads`
3. Verificar logs da API para erros de acesso a arquivos

## Backup

Faça backup regular de:
- Banco de dados: `mysqldump -u usuario -p sigls_db > backup.sql`
- Arquivos de upload: `tar -czf uploads-backup.tar.gz uploads/`
- Arquivo `.env`

## Monitoramento

Considere configurar:
- Monitoramento de logs com ferramentas como Logrotate
- Monitoramento de recursos com PM2 Plus ou similar
- Alertas para falhas de serviço

## Segurança

- Mantenha as dependências atualizadas: `npm audit`
- Use HTTPS em produção (configure SSL/TLS no Nginx)
- Configure firewall adequadamente
- Faça backups regulares
- Monitore logs de acesso e erro

---

**Suporte**: Para problemas, consulte os logs ou entre em contato com a equipe de desenvolvimento.
