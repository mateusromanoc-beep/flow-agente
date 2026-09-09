/**
 * Script de Simulação de Integração com Sistema Externo (CRM / n8n / ERP)
 * Este script demonstra como qualquer sistema externo pode consumir a API pública do Flow Agente
 * para disparar mensagens de WhatsApp para leads e clientes.
 */

const axios = require('axios');

const API_BASE_URL = process.env.FLOW_API_URL || 'http://localhost:3000';
const API_KEY = process.env.FLOW_API_KEY || 'fa_demo_key_example_12345';

async function simulateCrmIntegration() {
  console.log('🚀 Iniciando simulação de integração CRM -> Flow Agente...');
  console.log(`🌐 Endpoint alvo: ${API_BASE_URL}/v1/messages/send`);

  const payload = {
    number: '5511999998888',
    text: 'Olá Mariana! Identificamos seu interesse na Terapia Sistêmica da Gislaine Azzem através do nosso site. Gostaria de agendar seu primeiro atendimento online?',
  };

  try {
    console.log('\n📦 Enviando payload:');
    console.log(JSON.stringify(payload, null, 2));

    const response = await axios.post(`${API_BASE_URL}/v1/messages/send`, payload, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
    });

    console.log('\n✅ Resposta recebida da API do Flow Agente:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('\n🎉 Mensagem registrada e despachada para o WhatsApp com sucesso!');
  } catch (error) {
    if (error.response) {
      console.error('\n❌ Erro retornado pela API:');
      console.error(`Status HTTP: ${error.response.status}`);
      console.error('Detalhes:', error.response.data);
    } else {
      console.error('\n❌ Falha na conexão:', error.message);
    }
  }
}

simulateCrmIntegration();
