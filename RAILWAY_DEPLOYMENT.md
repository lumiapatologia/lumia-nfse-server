# 🚂 Deployment Railway - Passo a Passo

## ⚡ Opção RÁPIDA (Sem GitHub - Recomendado para iniciar)

### Passo 1: Preparar arquivos localmente

1. Crie uma pasta no seu computador:
```bash
mkdir lumia-nfse-server
cd lumia-nfse-server
```

2. Copie os arquivos:
- `package.json`
- `server.js`
- `.env.example` → renomeie para `.env`
- `.gitignore`

### Passo 2: Criar conta Railway

1. Acesse: https://railway.app
2. Clique "Sign Up"
3. Login com GitHub (ou outro método)
4. Crie novo projeto

### Passo 3: Deploy via Dashboard

1. No Railway Dashboard → "New Project"
2. Selecione "Deploy from Repo" → GitHub
3. Ou "Deploy using CLI" (mais fácil)

### Passo 4: Deploy via CLI (MAIS FÁCIL)

Instale Railway CLI:
```bash
npm install -g @railway/cli
```

No seu terminal, na pasta do projeto:
```bash
# Faça login
railway login

# Inicialize projeto
railway init

# Faça deploy
railway up
```

Railway vai:
- Detectar `package.json`
- Instalar dependências
- Rodar `npm start`
- Gerar URL pública

### Passo 5: Obter URL de Acesso

Após deploy, Railway mostra:
```
https://seu-projeto-abc123.railway.app
```

Copie essa URL!

---

## 📋 Checklist de Deployment

- [ ] Pasta criada com todos os arquivos
- [ ] `package.json` validado
- [ ] `server.js` sem erros
- [ ] Conta Railway criada
- [ ] Railway CLI instalado
- [ ] `railway login` feito
- [ ] `railway up` executado com sucesso
- [ ] URL pública obtida
- [ ] Health check testado: `curl https://sua-url/health`

---

## 🧪 Testar após Deploy

```bash
# Health check
curl https://sua-url/health

# Você deve ver:
# {"status":"ok","timestamp":"2026-07-20T..."}
```

---

## 🔴 Se algo der errado

### Erro: "npm: command not found"
- Instale Node.js: https://nodejs.org (LTS)
- Reinicie terminal

### Erro: "railway: command not found"
```bash
npm install -g @railway/cli
```

### Erro: "Railway not connecting"
- Verifique firewall
- Tente fazer login novamente: `railway logout` → `railway login`

### Erro: "Module not found"
- Verifique se `package.json` está na pasta correta
- Delete `node_modules/` e refaça: `npm install`

---

## 📞 Próximo Passo

Quando tiver a URL funcionando, integrate com Google Apps Script:

```javascript
const URL_SERVIDOR = "https://sua-url.railway.app";

// Chamar /gerar-nfse como explicado no README.md
```

---

**Pronto! Você tem seu servidor NFS-e rodando!** 🎉
