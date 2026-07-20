# 🚀 LUMIA NFS-e Server

Servidor Node.js para integração com o Sistema Nacional NFS-e (Nota Fiscal de Serviço eletrônica).

---

## 📋 Requisitos

- Node.js 18+
- Certificado Digital A1 (.pfx)
- Conta no Railway

---

## 🎯 Instalação Local (Teste)

### 1. Clone ou crie os arquivos:
```bash
mkdir lumia-nfse-server
cd lumia-nfse-server
# Copie package.json e server.js aqui
```

### 2. Instale dependências:
```bash
npm install
```

### 3. Crie arquivo `.env`:
```env
PORT=3000
NODE_ENV=development
```

### 4. Inicie o servidor:
```bash
npm start
```

### 5. Teste health check:
```bash
curl http://localhost:3000/health
```

---

## 🚂 Deploy no Railway

### 1. Crie conta no Railway
- Acesse: https://railway.app
- Faça login com GitHub

### 2. Crie novo projeto
- Clique em "New Project"
- Selecione "Deploy from GitHub repo"
- Ou "Empty Project" → Add Service → GitHub

### 3. Configure GitHub (se usar repo)
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/seu-usuario/lumia-nfse-server.git
git push -u origin main
```

### 4. No Dashboard do Railway
- Crie nova "Service" do tipo "GitHub Repo"
- Conecte seu repositório
- Configure como "Node.js"

### 5. Configure Variáveis de Ambiente
No Railway → "Variables":
```
PORT=3000
NODE_ENV=production
```

### 6. Deploy automático
- Railway vai detectar `package.json` automaticamente
- Comando: `npm start`

### 7. Obtenha URL pública
- Railway gera um domínio tipo: `https://seu-projeto-abc123.railway.app`
- Use essa URL no Apps Script

---

## 📞 Endpoints

### Health Check
```
GET /health
```
Resposta:
```json
{
  "status": "ok",
  "timestamp": "2026-07-20T10:30:00.000Z"
}
```

### Gerar NFS-e
```
POST /gerar-nfse
Content-Type: application/json
```

Body:
```json
{
  "valor": 1000.00,
  "cnpjCliente": "12.345.678/0001-00",
  "nomeCliente": "Clínica XYZ",
  "emailCliente": "cliente@example.com",
  "telefoneCliente": "27999999999",
  "mesReferencia": "06/2026",
  "certificadoBase64": "[CERTIFICADO_BASE64]",
  "senhaCertificado": "Lumiap25!"
}
```

Resposta (sucesso):
```json
{
  "sucesso": true,
  "chaveAcesso": "3205309...",
  "linkNFSe": "https://adn.producaorestrita.nfse.gov.br/contribuintes/nfse/3205309...",
  "xml": "[RESPOSTA_XML]"
}
```

Resposta (erro):
```json
{
  "sucesso": false,
  "erro": "Descrição do erro",
  "detalhes": "[DETALHES_API]"
}
```

---

## 🔑 Como obter Certificado em Base64

### No seu computador (bash/Windows):
```bash
# Converter .pfx para base64
cat seu-certificado.pfx | base64 > certificado.txt
```

### No PowerShell (Windows):
```powershell
[Convert]::ToBase64String([System.IO.File]::ReadAllBytes("seu-certificado.pfx")) | Out-File certificado.txt
```

### No Apps Script (Google):
Será feito via upload de arquivo no próprio Apps Script.

---

## 🔗 Integração com Google Apps Script

### No Apps Script da planilha:

```javascript
function criarNFSeViaServidor(valor, cnpjCliente, nomeCliente, emailCliente, mesReferencia) {
  const URL_SERVIDOR = "https://seu-projeto-abc123.railway.app";
  
  // Obter certificado (será feito via upload)
  const certificadoBase64 = "..."; // Será preenchido
  const senhaCertificado = "Lumiap25!";
  
  const payload = {
    valor: valor,
    cnpjCliente: cnpjCliente,
    nomeCliente: nomeCliente,
    emailCliente: emailCliente,
    telefoneCliente: "27999999999",
    mesReferencia: mesReferencia,
    certificadoBase64: certificadoBase64,
    senhaCertificado: senhaCertificado
  };
  
  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  const response = UrlFetchApp.fetch(URL_SERVIDOR + "/gerar-nfse", options);
  const resultado = JSON.parse(response.getContentText());
  
  return resultado;
}
```

---

## 🐛 Troubleshooting

### Erro: "Certificado inválido"
- Verificar se .pfx está correto
- Confirmar senha do certificado
- Testar com comando: `openssl pkcs12 -in cert.pfx -passin pass:senha`

### Erro: "mTLS failed"
- Certificado pode estar expirado
- Validar no sistema do governo
- Testar em ambiente de produção restrita primeiro

### Erro: "Connection timeout"
- Verificar firewall
- Confirmar URL da API está correta
- Testar conexão: `curl -v https://adn.producaorestrita.nfse.gov.br`

---

## 📚 Documentação

- **Manual NFS-e**: [Governo Federal](https://www.gov.br/nfse/)
- **API Producão Restrita**: [Swagger](https://adn.producaorestrita.nfse.gov.br/contribuintes/docs/index.html)

---

## 🤝 Suporte

Para dúvidas sobre o servidor, contacte a equipe LUMIA.

---

**Desenvolvido para LUMIA Patologia Animal LTDA**
