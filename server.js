const express = require('express');
const axios = require('axios');
const https = require('https');
const fs = require('fs');
require('dotenv').config();

const app = express();
app.use(express.json({ limit: '50mb' }));

const PORT = process.env.PORT || 3000;

// Constantes LUMIA
const CNPJ_PRESTADOR = '64109019000153';
const NOME_PRESTADOR = 'LUMIA PATOLOGIA ANIMAL LTDA';
const EMAIL_PRESTADOR = 'financeiro@lumiapatologia.com.br';
const CODIGO_MUNICIPIO = '3205309';
const CODIGO_TRIBUTACAO = '050301';
const NBS = '114059000';
const ALIQUOTA_SIMPLES = 15.5;
const API_NFSE = 'https://adn.producaorestrita.nfse.gov.br/contribuintes';

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Gerar NFS-e (versão teste - sem assinatura)
app.post('/gerar-nfse', async (req, res) => {
  try {
    const { valor, cnpjCliente, nomeCliente, emailCliente, mesReferencia } = req.body;

    if (!valor || !cnpjCliente || !nomeCliente || !emailCliente) {
      return res.status(400).json({ 
        sucesso: false, 
        erro: "Dados obrigatórios faltando" 
      });
    }

    // Simula resposta (em produção, envia para API real com assinatura)
    const chaveAcesso = gerarChaveAcesso();
    const linkNFSe = `${API_NFSE}/nfse/${chaveAcesso}`;

    res.json({
      sucesso: true,
      chaveAcesso: chaveAcesso,
      linkNFSe: linkNFSe,
      mensagem: "NFS-e gerada com sucesso (versão teste)"
    });

  } catch (e) {
    console.error("Erro:", e);
    res.status(500).json({ 
      sucesso: false, 
      erro: e.message 
    });
  }
});

// Gerar chave de acesso (formato simulado)
function gerarChaveAcesso() {
  const timestamp = Date.now().toString().slice(-10);
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return CODIGO_MUNICIPIO + CNPJ_PRESTADOR.slice(0, 8) + timestamp + random;
}

// Inicia servidor
app.listen(PORT, () => {
  console.log(`✓ Servidor LUMIA NFS-e rodando em porta ${PORT}`);
  console.log(`✓ Health check: http://localhost:${PORT}/health`);
});
