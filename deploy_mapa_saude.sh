#!/bin/bash

# Configurações de caminhos
CAMINHO_RAIZ="/dados/www/sao_joao_web"
CAMINHO_FRONTEND="/dados/www/sao_joao_web/frontend"
CAMINHO_BACKEND="/dados/www/sao_joao_web/backend"
CAMINHO_DIST="/dados/www/sao_joao_web/frontend/dist"

echo "----------------------------------------------------"
echo "🚀 Iniciando Deploy Inteligente (Front + Back)..."
echo "----------------------------------------------------"

# Função para calcular o hash do package.json
gerar_hash_package() {
    cat "$1/package.json" | md5sum | cut -d ' ' -f 1
}

# 1. Salvar hashes antigos antes do pull
HASH_FRONT_ANTIGO=$(gerar_hash_package "$CAMINHO_FRONTEND")
HASH_BACK_ANTIGO=$(gerar_hash_package "$CAMINHO_BACKEND")

# 2. Atualizar código via Git
echo "📥 Sincronizando com o Git..."
cd "$CAMINHO_RAIZ" || exit 1
git pull

# 3. Gerenciar o BACKEND (PM2 e Dependências)
echo "🔍 Verificando dependências do Backend..."
HASH_BACK_NOVO=$(gerar_hash_package "$CAMINHO_BACKEND")

if [ "$HASH_BACK_ANTIGO" != "$HASH_BACK_NOVO" ]; then
    echo "📦 Mudança detectada no package.json do Backend."
    cd "$CAMINHO_BACKEND" || exit 1
    
    echo "🗑️  Limpando node_modules e reinstalando..."
    rm -rf node_modules
    npm install
    
    echo "🔄 Reiniciando processo PM2 (Clean Start)..."
    # Adicionamos '|| true' para ignorar o erro se o processo não existir
    pm2 delete backend-sao-joao 2>/dev/null || true
    
    # Iniciamos o processo
    pm2 start npm --name "backend-sao-joao" -- start
else
    echo "✅ Dependências do Backend sem alterações."
    echo "♻️  Reiniciando apenas o código do Backend..."
    pm2 restart backend-sao-joao || pm2 start npm --name "backend-sao-joao" -- start
fi

# 4. Verificar mudanças no FRONTEND
echo "🔍 Verificando dependências do Frontend..."
HASH_FRONT_NOVO=$(gerar_hash_package "$CAMINHO_FRONTEND")

if [ "$HASH_FRONT_ANTIGO" != "$HASH_FRONT_NOVO" ]; then
    echo "📦 Mudança detectada no Frontend. Atualizando node_modules..."
    cd "$CAMINHO_FRONTEND" && rm -rf node_modules && npm install
else
    echo "✅ Frontend sem mudanças nas dependências."
fi

# 5. Build do Frontend
echo "🏗️  Iniciando Build do Frontend..."
cd "$CAMINHO_FRONTEND" || exit 1
rm -rf "$CAMINHO_DIST"
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build concluído!"
else
    echo "❌ Erro no Build. Abortando."
    exit 1
fi

# 6. Permissões
echo "🔑 Ajustando permissões da pasta dist..."
