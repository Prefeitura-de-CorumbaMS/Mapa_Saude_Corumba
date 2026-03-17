# Guia de Contribuição - SIGLS

## 🤝 Como Contribuir

Agradecemos seu interesse em contribuir com o SIGLS! Este documento fornece diretrizes para contribuir com o projeto.

## 📝 Código de Conduta

- Seja respeitoso e profissional
- Aceite críticas construtivas
- Foque no que é melhor para a comunidade
- Mostre empatia com outros membros

## 🔧 Configuração do Ambiente de Desenvolvimento

1. Fork o repositório
2. Clone seu fork: `git clone <seu-fork-url>`
3. Instale dependências: `npm install`
4. Configure `.env` conforme `.env.example`
5. Execute migrations: `npm run prisma:migrate`
6. Crie um branch: `git checkout -b feature/sua-feature`

## 📋 Padrões de Código

### JavaScript/Node.js

- Use `const` e `let`, evite `var`
- Prefira arrow functions quando apropriado
- Use async/await ao invés de callbacks
- Sempre trate erros adequadamente
- Comente código complexo

### React/JSX

- Use functional components com hooks
- Mantenha componentes pequenos e focados
- Use PropTypes ou TypeScript para type checking
- Siga convenções de nomenclatura do React

### Commits

Use Conventional Commits:

```
feat: adiciona nova funcionalidade
fix: corrige bug
docs: atualiza documentação
style: formatação de código
refactor: refatoração sem mudança de funcionalidade
test: adiciona ou corrige testes
chore: tarefas de manutenção
```

Exemplos:
```
feat(api): adiciona endpoint de relatórios
fix(etl): corrige erro na transformação de dados
docs(readme): atualiza instruções de instalação
```

## 🧪 Testes

- Escreva testes para novas funcionalidades
- Mantenha cobertura de testes acima de 70%
- Execute testes antes de fazer commit

## 🔀 Pull Requests

1. Atualize seu branch com a main: `git pull origin main`
2. Faça push do seu branch: `git push origin feature/sua-feature`
3. Abra um Pull Request no GitHub
4. Descreva claramente as mudanças
5. Referencie issues relacionadas

### Checklist do PR

- [ ] Código segue os padrões do projeto
- [ ] Testes foram adicionados/atualizados
- [ ] Documentação foi atualizada
- [ ] Commits seguem Conventional Commits
- [ ] Não há conflitos com a branch main

## 🐛 Reportando Bugs

Use o template de issue para bugs:

**Descrição:**
Descrição clara e concisa do bug.

**Passos para Reproduzir:**
1. Vá para '...'
2. Clique em '...'
3. Veja o erro

**Comportamento Esperado:**
O que deveria acontecer.

**Screenshots:**
Se aplicável, adicione screenshots.

**Ambiente:**
- OS: [ex: Windows 10]
- Node: [ex: 18.17.0]
- Browser: [ex: Chrome 120]

## 💡 Sugerindo Melhorias

Use o template de issue para features:

**Problema:**
Qual problema esta feature resolve?

**Solução Proposta:**
Como você imagina que isso funcione?

**Alternativas:**
Outras soluções que você considerou?

## 📚 Documentação

- Atualize README.md se necessário
- Documente APIs com comentários JSDoc
- Mantenha docs/ARCHITECTURE.md atualizado
- Adicione exemplos de uso quando relevante

## 🔐 Segurança

Se você descobrir uma vulnerabilidade de segurança:

1. **NÃO** abra uma issue pública
2. Envie email para: [email-seguranca@prefeitura.gov.br]
3. Inclua detalhes da vulnerabilidade
4. Aguarde resposta antes de divulgar

## 📞 Contato

- Issues: GitHub Issues
- Discussões: GitHub Discussions
- Email: [email-contato@prefeitura.gov.br]

## ✅ Aprovação

Pull Requests precisam de:
- 1 aprovação de um mantenedor
- Todos os checks passando
- Sem conflitos com main

## 📄 Licença

Ao contribuir, você concorda que suas contribuições serão licenciadas sob a mesma licença do projeto (MIT).
