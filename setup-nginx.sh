#!/bin/bash

# Script para configurar nginx para mapasaude.projetoestrategico.app
# Execute com: sudo bash setup-nginx.sh

set -e

echo "🔧 Configurando nginx para mapasaude.projetoestrategico.app..."

# 1. Copiar configuração do nginx
echo "📝 Copiando configuração do nginx..."
cp /tmp/mapasaude.conf /etc/nginx/sites-available/mapasaude.projetoestrategico.app.conf

# 2. Criar link simbólico
echo "🔗 Criando link simbólico..."
ln -sf /etc/nginx/sites-available/mapasaude.projetoestrategico.app.conf /etc/nginx/sites-enabled/

# 3. Testar configuração do nginx
echo "✅ Testando configuração do nginx..."
nginx -t

# 4. Fazer build do frontend (se necessário)
echo "🏗️  Fazendo build do frontend..."
cd /var/www/Mapa_Saude_Corumba
if [ ! -d "apps/web/dist" ]; then
    echo "📦 Diretório dist não existe, fazendo build..."
    npm run build --workspace=apps/web
fi

# 5. Recarregar nginx (sem SSL ainda)
echo "🔄 Recarregando nginx (HTTP apenas)..."
systemctl reload nginx

echo ""
echo "✅ Configuração HTTP completa!"
echo ""
echo "📋 Próximos passos:"
echo "1. Configure o DNS do subdomínio para apontar para este servidor"
echo "2. Execute: sudo certbot --nginx -d mapasaude.projetoestrategico.app"
echo "3. O Certbot configurará automaticamente o HTTPS"
echo ""
echo "🌐 Acesse: http://mapasaude.projetoestrategico.app (HTTP)"
echo "🔒 Após certbot: https://mapasaude.projetoestrategico.app (HTTPS)"
