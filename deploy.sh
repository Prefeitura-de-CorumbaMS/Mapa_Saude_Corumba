#!/bin/bash

# ============================================================================
# Deploy Inteligente - Mapa de Saúde Corumbá
# ============================================================================
# Inspirado no modelo de deploy do São João
# Adaptado para arquitetura de monorepo (npm workspaces)
# ============================================================================

# Configurações de caminhos
CAMINHO_RAIZ="/dados/www/mapa_saude"
CAMINHO_API="$CAMINHO_RAIZ/apps/api"
CAMINHO_WEB="$CAMINHO_RAIZ/apps/web"
CAMINHO_WORKER="$CAMINHO_RAIZ/apps/etl-worker"
CAMINHO_DIST="$CAMINHO_WEB/dist"

# Nomes dos processos PM2
PM2_API_NAME="mapasaude-api"
PM2_WORKER_NAME="mapasaude-worker"

echo "============================================================"
echo "🚀 Deploy Inteligente - Mapa de Saúde Corumbá"
echo "============================================================"
echo ""

# ============================================================================
# Função: Calcular hash MD5 de um arquivo
# ============================================================================
gerar_hash() {
    if [ -f "$1" ]; then
        cat "$1" | md5sum | cut -d ' ' -f 1
    else
        echo "arquivo-nao-existe"
    fi
}

# ============================================================================
# ETAPA 1: Salvar hashes ANTES do git pull
# ============================================================================
echo "📋 Capturando estado atual das dependências..."

HASH_ROOT_ANTIGO=$(gerar_hash "$CAMINHO_RAIZ/package.json")
HASH_API_ANTIGO=$(gerar_hash "$CAMINHO_API/package.json")
HASH_WEB_ANTIGO=$(gerar_hash "$CAMINHO_WEB/package.json")
HASH_WORKER_ANTIGO=$(gerar_hash "$CAMINHO_WORKER/package.json")
HASH_DATABASE_ANTIGO=$(gerar_hash "$CAMINHO_RAIZ/packages/database/package.json")
HASH_LOGGER_ANTIGO=$(gerar_hash "$CAMINHO_RAIZ/packages/logger/package.json")
HASH_SHARED_ANTIGO=$(gerar_hash "$CAMINHO_RAIZ/packages/shared/package.json")

echo "   ✓ Hashes capturados"
echo ""

# ============================================================================
# ETAPA 2: Atualizar código via Git
# ============================================================================
echo "📥 Sincronizando com o repositório Git..."
cd "$CAMINHO_RAIZ" || exit 1

if git pull; then
    echo "   ✓ Código atualizado com sucesso"
else
    echo "   ❌ Erro ao fazer git pull. Verifique o repositório."
    exit 1
fi
echo ""

# ============================================================================
# ETAPA 3: Verificar mudanças nas dependências
# ============================================================================
echo "🔍 Verificando mudanças nas dependências..."

HASH_ROOT_NOVO=$(gerar_hash "$CAMINHO_RAIZ/package.json")
HASH_API_NOVO=$(gerar_hash "$CAMINHO_API/package.json")
HASH_WEB_NOVO=$(gerar_hash "$CAMINHO_WEB/package.json")
HASH_WORKER_NOVO=$(gerar_hash "$CAMINHO_WORKER/package.json")
HASH_DATABASE_NOVO=$(gerar_hash "$CAMINHO_RAIZ/packages/database/package.json")
HASH_LOGGER_NOVO=$(gerar_hash "$CAMINHO_RAIZ/packages/logger/package.json")
HASH_SHARED_NOVO=$(gerar_hash "$CAMINHO_RAIZ/packages/shared/package.json")

# Flags de mudança
MUDANCA_ROOT=false
MUDANCA_PACKAGES=false
MUDANCA_API=false
MUDANCA_WEB=false
MUDANCA_WORKER=false

# Verificar mudanças
if [ "$HASH_ROOT_ANTIGO" != "$HASH_ROOT_NOVO" ]; then
    echo "   📦 Mudança detectada: package.json raiz"
    MUDANCA_ROOT=true
fi

if [ "$HASH_DATABASE_ANTIGO" != "$HASH_DATABASE_NOVO" ] || \
   [ "$HASH_LOGGER_ANTIGO" != "$HASH_LOGGER_NOVO" ] || \
   [ "$HASH_SHARED_ANTIGO" != "$HASH_SHARED_NOVO" ]; then
    echo "   📦 Mudança detectada: packages compartilhados"
    MUDANCA_PACKAGES=true
fi

if [ "$HASH_API_ANTIGO" != "$HASH_API_NOVO" ]; then
    echo "   📦 Mudança detectada: API"
    MUDANCA_API=true
fi

if [ "$HASH_WEB_ANTIGO" != "$HASH_WEB_NOVO" ]; then
    echo "   📦 Mudança detectada: Frontend"
    MUDANCA_WEB=true
fi

if [ "$HASH_WORKER_ANTIGO" != "$HASH_WORKER_NOVO" ]; then
    echo "   📦 Mudança detectada: Worker"
    MUDANCA_WORKER=true
fi

if [ "$MUDANCA_ROOT" = false ] && [ "$MUDANCA_PACKAGES" = false ] && \
   [ "$MUDANCA_API" = false ] && [ "$MUDANCA_WEB" = false ] && \
   [ "$MUDANCA_WORKER" = false ]; then
    echo "   ✅ Nenhuma mudança nas dependências"
fi
echo ""

# ============================================================================
# ETAPA 4: Reinstalar dependências (se necessário)
# ============================================================================
if [ "$MUDANCA_ROOT" = true ] || [ "$MUDANCA_PACKAGES" = true ] || \
   [ "$MUDANCA_API" = true ] || [ "$MUDANCA_WEB" = true ] || \
   [ "$MUDANCA_WORKER" = true ]; then

    echo "🗑️  Limpando node_modules e reinstalando dependências..."
    cd "$CAMINHO_RAIZ" || exit 1

    # Remover node_modules da raiz e de todos os workspaces
    rm -rf node_modules
    rm -rf apps/*/node_modules
    rm -rf packages/*/node_modules

    # Reinstalar tudo (workspaces)
    if npm install; then
        echo "   ✓ Dependências instaladas com sucesso"
    else
        echo "   ❌ Erro ao instalar dependências"
        exit 1
    fi
    echo ""
else
    echo "⏭️  Pulando reinstalação de dependências (sem mudanças)"
    echo ""
fi

# ============================================================================
# ETAPA 5: Deploy da API (Backend)
# ============================================================================
echo "🔧 Gerenciando API Backend..."

if [ "$MUDANCA_ROOT" = true ] || [ "$MUDANCA_PACKAGES" = true ] || [ "$MUDANCA_API" = true ]; then
    echo "   🔄 Mudanças significativas detectadas - Clean Restart"

    # Parar e remover processo PM2 (se existir)
    pm2 delete "$PM2_API_NAME" 2>/dev/null || true

    # Iniciar processo
    cd "$CAMINHO_RAIZ" || exit 1
    if pm2 start "$CAMINHO_API/src/index.js" --name "$PM2_API_NAME" --env production; then
        echo "   ✓ API iniciada com sucesso"
    else
        echo "   ❌ Erro ao iniciar API"
        exit 1
    fi
else
    echo "   ♻️  Reiniciando API (sem mudanças nas dependências)..."

    # Tentar reiniciar, se não existir, criar
    if ! pm2 restart "$PM2_API_NAME" 2>/dev/null; then
        echo "   📌 Processo não existe, criando novo..."
        cd "$CAMINHO_RAIZ" || exit 1
        pm2 start "$CAMINHO_API/src/index.js" --name "$PM2_API_NAME" --env production
    fi
    echo "   ✓ API reiniciada"
fi
echo ""

# ============================================================================
# ETAPA 6: Deploy do Worker (se existir e for necessário)
# ============================================================================
if [ -d "$CAMINHO_WORKER" ]; then
    echo "🔧 Gerenciando Worker ETL..."

    if [ "$MUDANCA_ROOT" = true ] || [ "$MUDANCA_PACKAGES" = true ] || [ "$MUDANCA_WORKER" = true ]; then
        echo "   🔄 Mudanças significativas detectadas - Clean Restart"

        # Parar e remover processo PM2 (se existir)
        pm2 delete "$PM2_WORKER_NAME" 2>/dev/null || true

        # Verificar se tem index.js ou main
        if [ -f "$CAMINHO_WORKER/src/index.js" ]; then
            cd "$CAMINHO_RAIZ" || exit 1
            pm2 start "$CAMINHO_WORKER/src/index.js" --name "$PM2_WORKER_NAME" --env production
            echo "   ✓ Worker iniciado com sucesso"
        else
            echo "   ⚠️  Worker não configurado para PM2"
        fi
    else
        echo "   ♻️  Reiniciando Worker (sem mudanças nas dependências)..."
        pm2 restart "$PM2_WORKER_NAME" 2>/dev/null || echo "   ⚠️  Worker não está rodando"
    fi
    echo ""
fi

# ============================================================================
# ETAPA 7: Build do Frontend (sempre executar)
# ============================================================================
echo "🏗️  Gerando build do Frontend..."

cd "$CAMINHO_RAIZ" || exit 1

# Limpar build anterior
if [ -d "$CAMINHO_DIST" ]; then
    rm -rf "$CAMINHO_DIST"
    echo "   🗑️  Build anterior removido"
fi

# Executar build
if npm run build:web; then
    echo "   ✓ Build gerado com sucesso"
else
    echo "   ❌ Erro ao gerar build do Frontend"
    exit 1
fi

# Verificar se o build foi criado
if [ ! -d "$CAMINHO_DIST" ]; then
    echo "   ❌ Erro: Pasta dist não foi gerada"
    exit 1
fi
echo ""

# ============================================================================
# ETAPA 8: Configurar permissões e Nginx
# ============================================================================
echo "🔑 Ajustando permissões..."

# Ajustar permissões da pasta dist para o Nginx
chmod -R 755 "$CAMINHO_DIST"
echo "   ✓ Permissões ajustadas"

# Recarregar Nginx (se estiver configurado)
if command -v nginx &> /dev/null; then
    echo ""
    echo "🔄 Recarregando Nginx..."

    if sudo nginx -t 2>/dev/null; then
        sudo systemctl reload nginx
        echo "   ✓ Nginx recarregado com sucesso"
    else
        echo "   ⚠️  Erro na configuração do Nginx. Execute: sudo nginx -t"
    fi
fi
echo ""

# ============================================================================
# ETAPA 9: Salvar configuração do PM2
# ============================================================================
echo "💾 Salvando configuração do PM2..."
pm2 save
echo "   ✓ Configuração salva"
echo ""

# ============================================================================
# ETAPA 10: Resumo final
# ============================================================================
echo "============================================================"
echo "✅ Deploy concluído com sucesso!"
echo "============================================================"
echo ""
echo "📊 Status dos serviços:"
echo ""

# Mostrar status do PM2
pm2 status

echo ""
echo "🌐 Acessos:"
echo "   Frontend: http://localhost:8005"
echo "   API:      http://localhost:8006"
echo ""
echo "📝 Comandos úteis:"
echo "   Ver logs da API:    pm2 logs $PM2_API_NAME"
echo "   Ver status PM2:     pm2 status"
echo "   Monitorar PM2:      pm2 monit"
echo "   Logs do Nginx:      sudo tail -f /var/log/nginx/mapasaude_error.log"
echo ""
echo "============================================================"
