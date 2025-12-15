# 🚀 Deploy do Google Analytics em Produção

## 📋 Servidor de Produção

**URL:** https://mapasaude.projetoestrategico.app/

---

## ✅ Status do Código

- ✅ Código commitado: `e5271ff`
- ✅ Branch main atualizada
- ✅ Push para GitHub concluído
- ⏳ **Aguardando deploy em produção**

---

## 🔧 Comandos para Deploy

### **No servidor de produção (SSH):**

```bash
# 1. Conectar ao servidor
ssh usuario@mapasaude.projetoestrategico.app

# 2. Navegar para o diretório do projeto
cd /var/www/Mapa_Saude_Corumba
# OU (se estiver em outro diretório)
cd /caminho/do/projeto

# 3. Fazer backup (opcional mas recomendado)
cp -r apps/web/dist apps/web/dist.backup-$(date +%Y%m%d-%H%M%S)

# 4. Puxar as últimas alterações do GitHub
git fetch origin
git checkout main
git pull origin main

# 5. Instalar dependências (se houver novas)
npm install

# 6. Build do projeto
npm run build

# 7. Reiniciar serviços (se necessário)
# Opção A: Se usa PM2
pm2 restart all

# Opção B: Se usa systemd
sudo systemctl restart mapasaude-api
sudo systemctl restart mapasaude-web

# Opção C: Se usa nginx apenas (arquivos estáticos)
# Não precisa reiniciar nada, apenas copiar os arquivos

# 8. Verificar se está funcionando
curl -I https://mapasaude.projetoestrategico.app/
```

---

## 🧪 Verificar se o Google Analytics está Funcionando

### **1. Inspecionar o Código-Fonte**

```bash
# No servidor ou localmente
curl https://mapasaude.projetoestrategico.app/ | grep "G-CDFVCR99CC"
```

**Deve retornar:**
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-CDFVCR99CC"></script>
```

### **2. Testar no Navegador**

1. Abra: https://mapasaude.projetoestrategico.app/
2. Pressione F12 (DevTools)
3. Aba **Console** → procure por logs `[Analytics]`
4. Aba **Network** → filtre por "google-analytics" ou "collect"
5. Interaja com o site (buscar, clicar em unidades, etc)
6. Veja as requisições sendo enviadas

### **3. Verificar em Tempo Real no GA4**

1. Acesse: https://analytics.google.com/
2. Selecione: **"Mapa da Saúde de Corumbá"**
3. Menu: **"Tempo real"**
4. Abra o site em outra aba
5. Veja os eventos aparecendo em tempo real! 🎉

---

## 📊 Eventos que Devem Aparecer

Assim que usuários acessarem o site, você verá:

| Evento | Quando Acontece |
|--------|----------------|
| `page_view` | Toda vez que carrega a página |
| `busca_realizada` | Quando usuário faz uma busca |
| `visualizacao_unidade` | Quando clica em uma unidade |
| `clique_mapa` | Quando clica no mapa |
| `contato_unidade` | Quando clica em WhatsApp/Como Chegar |
| `clique_rede_social` | Quando clica em rede social |
| `filtro_aplicado` | Quando aplica filtro na legenda |

---

## ⚠️ Troubleshooting

### **Problema: Script GA4 não aparece no site**

**Solução:**
```bash
# Verificar se o build incluiu as mudanças
cat apps/web/dist/index.html | grep "G-CDFVCR99CC"

# Se não aparecer, refazer o build
npm run build

# Verificar novamente
cat apps/web/dist/index.html | grep "G-CDFVCR99CC"
```

### **Problema: Build falha**

**Solução:**
```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install
npm run build
```

### **Problema: Código antigo ainda está no ar**

**Solução:**
```bash
# Limpar cache do navegador
# Ctrl + Shift + Del (Windows/Linux)
# Cmd + Shift + Del (Mac)

# OU testar em aba anônima
# Ctrl + Shift + N (Chrome)
# Ctrl + Shift + P (Firefox)
```

### **Problema: Eventos não aparecem no GA4**

**Solução:**
1. Aguarde até 5 minutos (delay normal)
2. Verifique console do navegador por erros JavaScript
3. Teste em dispositivo/navegador diferente
4. Verifique se ad-blockers estão desabilitados

---

## 📁 Arquivos Modificados Neste Deploy

```
✅ apps/web/index.html (Google Analytics script)
✅ apps/web/src/utils/analytics.js (Biblioteca de eventos)
✅ apps/web/src/pages/MapPage.jsx (Rastreamento integrado)
✅ GOOGLE_ANALYTICS_IMPLEMENTATION.md (Documentação)
```

---

## 🎯 Após o Deploy

### **Imediatamente:**
- ✅ Abra o site e teste as funcionalidades
- ✅ Verifique console do navegador
- ✅ Veja eventos em tempo real no GA4

### **Em 24-48 horas:**
- ✅ Acesse relatórios completos no GA4
- ✅ Analise buscas mais usadas
- ✅ Veja unidades mais acessadas
- ✅ Entenda comportamento dos usuários

---

## 📞 Suporte

**Problemas com o deploy?**
- Consulte: [GOOGLE_ANALYTICS_IMPLEMENTATION.md](GOOGLE_ANALYTICS_IMPLEMENTATION.md)
- Verifique logs do servidor
- Entre em contato com o desenvolvedor

---

## ✅ Checklist Final

Antes de considerar o deploy completo:

- [ ] Código puxado do GitHub (`git pull origin main`)
- [ ] Dependências instaladas (`npm install`)
- [ ] Build executado com sucesso (`npm run build`)
- [ ] Serviços reiniciados (se necessário)
- [ ] Site acessível em https://mapasaude.projetoestrategico.app/
- [ ] Script GA4 presente no código-fonte
- [ ] Console do navegador sem erros
- [ ] Eventos aparecendo no GA4 Tempo Real
- [ ] Testes de busca funcionando
- [ ] Testes de clique no mapa funcionando

---

## 🎉 Pronto!

Após completar estes passos, o Google Analytics estará **100% funcional em produção** e começará a coletar dados dos usuários reais!

**Acesse o dashboard:**
https://analytics.google.com/

---

**Última atualização:** 15/12/2024
**Commit:** e5271ff
**ID GA4:** G-CDFVCR99CC
