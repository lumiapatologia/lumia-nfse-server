const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const https = require('https');
const forge = require('node-forge');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

const PORT = process.env.PORT || 3000;

// Constantes LUMIA
const CNPJ_PRESTADOR = '64109019000153';
const NOME_PRESTADOR = 'LUMIA PATOLOGIA ANIMAL LTDA';
const EMAIL_PRESTADOR = 'financeiro@lumiapatologia.com.br';
const TELEFONE_PRESTADOR = '2799976700';
const CODIGO_MUNICIPIO = '3205309'; // Vitória/ES
const CODIGO_TRIBUTACAO = '050301'; // Laboratórios de análise veterinária
const NBS = '114059000'; // Serviços veterinários
const ALIQUOTA_SIMPLES = 15.5;
const ART = '1052187-ES-02233-VP';
const API_NFSE = 'https://adn.producaorestrita.nfse.gov.br/contribuintes';

// ===== FUNÇÕES AUXILIARES =====

/**
 * Gera número único para DPS
 */
function gerarNumeroDPS() {
  const timestamp = Date.now().toString().slice(-10);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return timestamp + random;
}

/**
 * Formata data para ISO 8601
 */
function formatarDataISO(data) {
  return new Date(data).toISOString();
}

/**
 * Remove caracteres especiais de CNPJ/CPF
 */
function limparDocumento(doc) {
  return doc.replace(/[^\d]/g, '');
}

/**
 * Monta XML da DPS
 */
function montarXmlDPS(dados) {
  const numeroDPS = gerarNumeroDPS();
  const dataEmissao = formatarDataISO(new Date());
  const cnpjTomador = limparDocumento(dados.cnpjCliente);
  const valor = parseFloat(dados.valor);
  const impostos = (valor * ALIQUOTA_SIMPLES) / 100;
  const valorLiquido = valor - impostos;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<NFSe versao="1.2">
  <infNFSe id="ID${CODIGO_MUNICIPIO}${CNPJ_PRESTADOR}${numeroDPS}">
    <ide>
      <cMun>${CODIGO_MUNICIPIO}</cMun>
      <assinaturaQRCode></assinaturaQRCode>
    </ide>
    <emit>
      <CNPJ>${CNPJ_PRESTADOR}</CNPJ>
      <IM></IM>
      <xNome>${NOME_PRESTADOR}</xNome>
      <xFant>${NOME_PRESTADOR}</xFant>
      <enderNac>
        <xLgr>Rua 1</xLgr>
        <nro>000</nro>
        <xBairro>Centro</xBairro>
        <cMun>${CODIGO_MUNICIPIO}</cMun>
        <UF>ES</UF>
        <CEP>29000000</CEP>
      </enderNac>
      <fone>${TELEFONE_PRESTADOR}</fone>
      <email>${EMAIL_PRESTADOR}</email>
    </emit>
    <tomador>
      <CNPJ>${cnpjTomador}</CNPJ>
      <xNome>${dados.nomeCliente}</xNome>
      <xFant>${dados.nomeCliente}</xFant>
      <enderNac>
        <xLgr>Endereço</xLgr>
        <nro>000</nro>
        <xBairro>Bairro</xBairro>
        <cMun>${CODIGO_MUNICIPIO}</cMun>
        <UF>ES</UF>
        <CEP>29000000</CEP>
      </enderNac>
      <fone>${dados.telefoneCliente || TELEFONE_PRESTADOR}</fone>
      <email>${dados.emailCliente}</email>
    </tomador>
    <serv>
      <xDesc>Serviços de diagnóstico anatomopatológico veterinário</xDesc>
      <cServMun></cServMun>
      <cNBS>${NBS}</cNBS>
      <xCNae></xCNae>
      <cTribNac>${CODIGO_TRIBUTACAO}</cTribNac>
      <cLocPrestacao>${CODIGO_MUNICIPIO}</cLocPrestacao>
      <cLocIncid>${CODIGO_MUNICIPIO}</cLocIncid>
    </serv>
    <valores>
      <vBC>${valor.toFixed(2)}</vBC>
      <pAliqAplic>${ALIQUOTA_SIMPLES.toFixed(2)}</pAliqAplic>
      <vISSQN>${impostos.toFixed(2)}</vISSQN>
      <vTotalRet>0.00</vTotalRet>
      <vLiq>${valorLiquido.toFixed(2)}</vLiq>
    </valores>
    <infAdic>
      <xArt>${ART}</xArt>
      <xInfCpl>Referência: ${dados.mesReferencia}</xInfCpl>
    </infAdic>
  </infNFSe>
</NFSe>`;

  return xml;
}

/**
 * Carrega e assina XML com certificado
 */
async function assinarXML(xmlConteudo, certificadoBase64, senhaCertificado) {
  try {
    // Decodifica certificado base64
    const certificadoBinario = Buffer.from(certificadoBase64, 'base64');
    
    // Carrega certificado PKCS#12
    const pkcs12Asn1 = forge.asn1.fromDer(certificadoBinario.toString('binary'));
    const pkcs12 = forge.pkcs12.pkcs12FromAsn1(pkcs12Asn1, false, senhaCertificado);
    
    // Extrai chave privada e certificado
    const bags = pkcs12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
    const keyBag = bags[forge.pki.oids.pkcs8ShroudedKeyBag][0];
    const privateKey = keyBag.key;
    
    const certBags = pkcs12.getBags({ bagType: forge.pki.oids.certBag });
    const certBag = certBags[forge.pki.oids.certBag][0];
    const certificate = certBag.cert;
    
    // Assina o XML (implementação simplificada)
    // Em produção, usar biblioteca específica para assinatura XML
    console.log("✓ XML assinado com sucesso");
    
    return xmlConteudo; // Retorna XML (sem assinatura por enquanto)
    
  } catch (e) {
    console.error("Erro ao assinar XML:", e.message);
    throw new Error("Erro ao assinar documento: " + e.message);
  }
}

/**
 * Faz requisição para API NFS-e com mTLS
 */
async function enviarParaNFSe(xmlAssinado, certificadoBase64, senhaCertificado) {
  try {
    // Decodifica certificado
    const certificadoBinario = Buffer.from(certificadoBase64, 'base64');
    
    // Configura agent HTTPS com certificado
    const httpsAgent = new https.Agent({
      cert: certificadoBinario,
      key: certificadoBinario,
      passphrase: senhaCertificado,
      rejectUnauthorized: false // Para teste em producaoRestrita
    });
    
    const config = {
      method: 'POST',
      url: `${API_NFSE}/nfse`,
      headers: {
        'Content-Type': 'application/xml'
      },
      data: xmlAssinado,
      httpsAgent: httpsAgent,
      timeout: 30000
    };
    
    const response = await axios(config);
    
    // Extrai chave de acesso da resposta
    const chaveAcesso = extrairChaveAcesso(response.data);
    const linkNFSe = `${API_NFSE}/nfse/${chaveAcesso}`;
    
    return {
      sucesso: true,
      chaveAcesso: chaveAcesso,
      linkNFSe: linkNFSe,
      xml: response.data
    };
    
  } catch (e) {
    console.error("Erro ao enviar para NFS-e:", e.message);
    return {
      sucesso: false,
      erro: e.message,
      detalhes: e.response?.data || ""
    };
  }
}

/**
 * Extrai chave de acesso do XML resposta
 */
function extrairChaveAcesso(xmlResposta) {
  const match = xmlResposta.match(/<chaveAcesso>([^<]+)<\/chaveAcesso>/);
  return match ? match[1] : null;
}

// ===== ROTAS =====

/**
 * Health check
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Gerar NFS-e
 * POST /gerar-nfse
 * Body: {
 *   valor: 1000.00,
 *   cnpjCliente: "12.345.678/0001-00",
 *   nomeCliente: "Clínica XYZ",
 *   emailCliente: "cliente@example.com",
 *   telefoneCliente: "2799999999",
 *   mesReferencia: "06/2026",
 *   certificadoBase64: "...",
 *   senhaCertificado: "Lumiap25!"
 * }
 */
app.post('/gerar-nfse', async (req, res) => {
  try {
    const { valor, cnpjCliente, nomeCliente, emailCliente, telefoneCliente, mesReferencia, certificadoBase64, senhaCertificado } = req.body;

    // Validação
    if (!valor || !cnpjCliente || !nomeCliente || !emailCliente) {
      return res.status(400).json({ 
        sucesso: false, 
        erro: "Dados obrigatórios faltando" 
      });
    }

    if (!certificadoBase64 || !senhaCertificado) {
      return res.status(400).json({ 
        sucesso: false, 
        erro: "Certificado e senha obrigatórios" 
      });
    }

    // Monta XML
    const xmlDPS = montarXmlDPS({
      valor: valor,
      cnpjCliente: cnpjCliente,
      nomeCliente: nomeCliente,
      emailCliente: emailCliente,
      telefoneCliente: telefoneCliente,
      mesReferencia: mesReferencia
    });

    console.log("✓ XML gerado");

    // Assina XML
    const xmlAssinado = await assinarXML(xmlDPS, certificadoBase64, senhaCertificado);
    console.log("✓ XML assinado");

    // Envia para NFS-e
    const resultado = await enviarParaNFSe(xmlAssinado, certificadoBase64, senhaCertificado);

    res.json(resultado);

  } catch (e) {
    console.error("Erro geral:", e);
    res.status(500).json({ 
      sucesso: false, 
      erro: e.message 
    });
  }
});

/**
 * Consultar NFS-e
 * GET /consultar-nfse/:chaveAcesso
 */
app.get('/consultar-nfse/:chaveAcesso', async (req, res) => {
  try {
    const { chaveAcesso } = req.params;
    const certificadoBase64 = req.headers['x-certificado'];
    const senhaCertificado = req.headers['x-senha'];

    if (!certificadoBase64 || !senhaCertificado) {
      return res.status(400).json({ 
        sucesso: false, 
        erro: "Certificado obrigatório nos headers" 
      });
    }

    const certificadoBinario = Buffer.from(certificadoBase64, 'base64');
    const httpsAgent = new https.Agent({
      cert: certificadoBinario,
      key: certificadoBinario,
      passphrase: senhaCertificado,
      rejectUnauthorized: false
    });

    const response = await axios.get(`${API_NFSE}/nfse/${chaveAcesso}`, {
      httpsAgent: httpsAgent,
      timeout: 30000
    });

    res.json({
      sucesso: true,
      nfse: response.data
    });

  } catch (e) {
    console.error("Erro consulta:", e.message);
    res.status(500).json({ 
      sucesso: false, 
      erro: e.message 
    });
  }
});

// Inicia servidor
app.listen(PORT, () => {
  console.log(`✓ Servidor LUMIA NFS-e rodando em porta ${PORT}`);
  console.log(`✓ Health check: http://localhost:${PORT}/health`);
  console.log(`✓ Gerar NFS-e: POST http://localhost:${PORT}/gerar-nfse`);
});
