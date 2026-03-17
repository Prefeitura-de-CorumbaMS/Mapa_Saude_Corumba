# 🚀 Guia de Instalação em Produção
## Mapa Saúde Corumbá - mapasaude.projetoestrategico.app

Este guia contém todos os passos para configurar a aplicação em produção.

---

## 📋 Pré-requisitos

- ✅ Subdomínio DNS configurado: `mapasaude.projetoestrategico.app` apontando para este servidor
- ✅ Node.js instalado
- ✅ MySQL em execução
- ✅ Nginx instalado
- ✅ Porta 3002 livre (API já configurada)

---

## 🔧 Passo 1: Configurar Nginx

Execute os seguintes comandos como **root** ou com **sudo**:

```bash
# 1. Executar script de configuração do nginx
cd /var/www/Mapa_Saude_Corumba
sudo bash setup-nginx.sh
```

Isso irá:
- Copiar configuração do nginx
- Criar link simbólico
- Testar configuração
- Fazer build do frontend
- Recarregar nginx

---

## 🔒 Passo 2: Configurar SSL/HTTPS com Certbot

Após o nginx estar rodando e o DNS configurado:

```bash
# 1. Instalar certbot (se ainda não estiver instalado)
sudo apt update
sudo apt install certbot python3-certbot-nginx -y

# 2. Obter certificado SSL
sudo certbot --nginx -d mapasaude.projetoestrategico.app

# 3. Responder às perguntas do certbot:
#    - Email: seu@email.com
#    - Termos de Serviço: (A)gree
#    - Compartilhar email: (Y)es ou (N)o
#    - Redirecionar HTTP para HTTPS: 2 (Redirect)
```

O Certbot irá:
- Obter certificado SSL gratuito do Let's Encrypt
- Configurar automaticamente o nginx para HTTPS
- Configurar renovação automática

---

## 🏗️ Passo 3: Build do Frontend para Produção

```bash
# 1. Voltar para o diretório do projeto
cd /var/www/Mapa_Saude_Corumba

# 2. Fazer build de produção
bash build-production.sh
```

---

## 🚀 Passo 4: Configurar Serviço da API (Systemd)

```bash
# 1. Copiar arquivo de serviço
sudo cp mapasaude-api.service /etc/systemd/system/

# 2. Recarregar systemd
sudo systemctl daemon-reload

# 3. Habilitar serviço para iniciar automaticamente
sudo systemctl enable mapasaude-api

# 4. Iniciar serviço
sudo systemctl start mapasaude-api

# 5. Verificar status
sudo systemctl status mapasaude-api
```

---

## 📊 Passo 5: Verificar Logs

### Logs da API:
```bash
# Ver logs em tempo real
sudo journalctl -u mapasaude-api -f

# Ver últimas 100 linhas
sudo journalctl -u mapasaude-api -n 100

# Logs de arquivo
tail -f /var/www/Mapa_Saude_Corumba/logs/api-stdout.log
tail -f /var/www/Mapa_Saude_Corumba/logs/api-stderr.log
```

### Logs do Nginx:
```bash
# Access log
sudo tail -f /var/log/nginx/mapasaude_access.log

# Error log
sudo tail -f /var/log/nginx/mapasaude_error.log
```

---

## ✅ Passo 6: Testar Aplicação

1. **Frontend:** https://mapasaude.projetoestrategico.app
2. **API (Health Check):** https://mapasaude.projetoestrategico.app/api/
3. **Admin:** https://mapasaude.projetoestrategico.app/admin/login

**Credenciais Admin:**
- Username: `admin`
- Email: `admin@corumba.ms.gov.br`
- Senha: `Elizael@011224`

---

## 🔄 Comandos Úteis

### Gerenciar Serviço da API:
```bash
sudo systemctl start mapasaude-api      # Iniciar
sudo systemctl stop mapasaude-api       # Parar
sudo systemctl restart mapasaude-api    # Reiniciar
sudo systemctl status mapasaude-api     # Status
```

### Gerenciar Nginx:
```bash
sudo nginx -t                            # Testar configuração
sudo systemctl reload nginx              # Recarregar
sudo systemctl restart nginx             # Reiniciar
sudo systemctl status nginx              # Status
```

### Fazer Deploy de Atualizações:
```bash
cd /var/www/Mapa_Saude_Corumba

# 1. Puxar código atualizado
git pull origin data/unidades-cnes-addresses

# 2. Instalar dependências (se houver)
npm install

# 3. Gerar cliente Prisma (se schema mudou)
npm run prisma:generate

# 4. Fazer build do frontend
bash build-production.sh

# 5. Reiniciar API
sudo systemctl restart mapasaude-api
```

---

## 🔧 Solução de Problemas

### API não inicia:
```bash
# Ver logs de erro
sudo journalctl -u mapasaude-api -n 50

# Verificar porta
sudo netstat -tulpn | grep 3002
```

### Frontend não carrega:
```bash
# Verificar build
ls -la apps/web/dist/

# Verificar logs do nginx
sudo tail -100 /var/log/nginx/mapasaude_error.log
```

### SSL não funciona:
```bash
# Renovar certificado manualmente
sudo certbot renew --dry-run
sudo certbot renew
```

---

## 📌 Portas Utilizadas

- **3002:** API Backend (localhost apenas, proxy via nginx)
- **80:** HTTP (redireciona para HTTPS)
- **443:** HTTPS (público)

**Outras aplicações no servidor:**
- **3000:** prefeitura.projetoestrategico.app
- **4001:** holywins.projetoestrategico.app
- **5000:** projetoestrategico.app

✅ Não há conflito de portas!

---

## 🎉 Conclusão

Após seguir todos os passos, sua aplicação estará rodando em:

🌐 **https://mapasaude.projetoestrategico.app**

Com:
- ✅ HTTPS/SSL configurado
- ✅ Frontend otimizado (build de produção)
- ✅ API rodando como serviço
- ✅ Logs centralizados
- ✅ Restart automático em caso de falha
- ✅ Renovação automática de certificados SSL
