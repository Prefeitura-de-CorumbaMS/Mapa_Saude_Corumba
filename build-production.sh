#!/bin/bash

# Script para fazer build de produção do frontend
# Execute com: bash build-production.sh

set -e

echo "🏗️  Iniciando build de produção..."

# 1. Carregar variáveis de ambiente de produção
echo "📝 Carregando variáveis de ambiente de produção..."
export $(cat .env.production | grep -v '^#' | xargs)

# 2. Fazer build do frontend
echo "📦 Fazendo build do frontend..."
npm run build --workspace=apps/web

# 3. Verificar se o build foi criado
if [ -d "apps/web/dist" ]; then
    echo "✅ Build criado com sucesso em apps/web/dist"
    echo "📊 Tamanho do build:"
    du -sh apps/web/dist
    echo ""
    echo "📁 Arquivos criados:"
    ls -lh apps/web/dist/
else
    echo "❌ Erro: Diretório dist não foi criado"
    exit 1
fi

echo ""
echo "✅ Build de produção concluído!"
echo "🌐 API URL configurada: $VITE_API_URL"
