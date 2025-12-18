#!/bin/bash

# --- CONFIGURAÇÃO DE CAMINHOS ABSOLUTOS ---
WWW_DIR="/var/www"
MAPASAUDE_DIR="${WWW_DIR}/mapasaude"

# Caminho fixo e absoluto do build
SOURCE_DIR="/home/elizael/Mapa_Saude_Corumba/apps/web/dist"

echo "Iniciando deploy do Front-end do Mapa da Saúde..."
echo "---------------------------------------------------------"

# --- GERENCIAMENTO DO DIRETÓRIO /var/www/mapasaude ---

echo "1. Excluindo e recriando diretório de destino: ${MAPASAUDE_DIR}"
sudo rm -rf "${MAPASAUDE_DIR}"
sudo mkdir -p "${MAPASAUDE_DIR}"

# --- CÓPIA DOS ARQUIVOS ---

echo "2. Copiando arquivos de ${SOURCE_DIR} para ${MAPASAUDE_DIR}..."

if [ -d "${SOURCE_DIR}" ]; then
    sudo cp -r "${SOURCE_DIR}/." "${MAPASAUDE_DIR}/"
    echo "Cópia concluída."
else
    echo "ERRO: Diretório de origem ${SOURCE_DIR} não encontrado. Abortando!"
    echo "Execute 'npm run build:web' primeiro!"
    exit 1
fi
echo "---------------------------------------------------------"

# --- AJUSTE DE PERMISSÕES E PROPRIEDADE ---

echo "3. Definindo www-data:www-data como proprietário..."
sudo chown -R www-data:www-data "${MAPASAUDE_DIR}"

echo "4. Ajustando permissões (diretórios 755)..."
sudo find "${MAPASAUDE_DIR}" -type d -exec chmod 755 {} \;

echo "5. Ajustando permissões (arquivos 644)..."
sudo find "${MAPASAUDE_DIR}" -type f -exec chmod 644 {} \;

echo "---------------------------------------------------------"
echo "✅ Deploy do frontend concluído com sucesso!"
echo "Frontend agora está em: ${MAPASAUDE_DIR}"
