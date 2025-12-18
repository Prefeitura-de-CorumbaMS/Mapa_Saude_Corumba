#!/bin/bash
# Script de deploy do frontend para Nginx
# Este script automatiza a configuração do Nginx para servir o frontend em produção

set -e

echo "🚀 Deploy do Frontend - Mapa de Saúde Corumbá"
echo "=============================================="
echo ""

# Verificar se está sendo executado como root ou com sudo
if [ "$EUID" -ne 0 ]; then
    echo "⚠️  Este script precisa ser executado como root ou com sudo"
    echo "   Execute: sudo bash scripts/deploy-frontend.sh"
    exit 1
fi

# Diretórios
PROJECT_DIR="/home/elizael/Mapa_Saude_Corumba"
NGINX_AVAILABLE="/etc/nginx/sites-available"
NGINX_ENABLED="/etc/nginx/sites-enabled"
SITE_NAME="mapasaude"

echo "📁 Diretório do projeto: $PROJECT_DIR"
echo ""

# 1. Verificar se o build existe
if [ ! -d "$PROJECT_DIR/apps/web/dist" ]; then
    echo "❌ Build não encontrado!"
    echo "   Execute primeiro: npm run build:web"
    exit 1
fi

echo "✅ Build encontrado"

# 2. Verificar se o Nginx está instalado
if ! command -v nginx &> /dev/null; then
    echo "❌ Nginx não está instalado!"
    echo "   Instale com: sudo apt update && sudo apt install nginx"
    exit 1
fi

echo "✅ Nginx instalado"

# 3. Copiar configuração do Nginx
echo ""
echo "📝 Copiando configuração do Nginx..."
cp "$PROJECT_DIR/nginx.conf" "$NGINX_AVAILABLE/$SITE_NAME"
echo "✅ Configuração copiada para $NGINX_AVAILABLE/$SITE_NAME"

# 4. Criar link simbólico se não existir
if [ ! -L "$NGINX_ENABLED/$SITE_NAME" ]; then
    echo "🔗 Criando link simbólico..."
    ln -s "$NGINX_AVAILABLE/$SITE_NAME" "$NGINX_ENABLED/$SITE_NAME"
    echo "✅ Link simbólico criado"
else
    echo "ℹ️  Link simbólico já existe"
fi

# 5. Testar configuração do Nginx
echo ""
echo "🧪 Testando configuração do Nginx..."
if nginx -t; then
    echo "✅ Configuração válida!"
else
    echo "❌ Erro na configuração do Nginx"
    exit 1
fi

# 6. Recarregar Nginx
echo ""
echo "🔄 Recarregando Nginx..."
systemctl reload nginx
echo "✅ Nginx recarregado"

# 7. Verificar status
echo ""
echo "📊 Status do Nginx:"
systemctl status nginx --no-pager | head -10

echo ""
echo "✅ Deploy concluído com sucesso!"
echo ""
echo "🌐 Frontend disponível em: http://localhost:8005"
echo "🔧 API rodando em: http://localhost:8006"
echo ""
echo "📝 Próximos passos:"
echo "   1. Certifique-se de que a API está rodando na porta 8006"
echo "   2. Acesse http://localhost:8005 no navegador"
echo "   3. Verifique os logs em /var/log/nginx/mapasaude_*.log"
echo ""
