/**
 * Testa endpoints da API de casos
 */

const axios = require('axios');

const API_URL = 'http://localhost:8006/api/vigilancia/dengue';

async function testAPI() {
  try {
    console.log('\n🧪 TESTANDO ENDPOINTS DA API\n');

    // 1. Testar /casos/se
    console.log('1️⃣ Testando GET /casos/se?ano=2026&se=10');
    const respSE = await axios.get(`${API_URL}/casos/se?ano=2026&se=10`);
    console.log('✅ Status:', respSE.status);
    console.log('📊 Dados:', JSON.stringify(respSE.data, null, 2));

    // 2. Testar /casos/bairros (notificados)
    console.log('\n2️⃣ Testando GET /casos/bairros?ano=2026&se=10&tipo=notificados');
    const respBairrosNotif = await axios.get(`${API_URL}/casos/bairros?ano=2026&se=10&tipo=notificados`);
    console.log('✅ Status:', respBairrosNotif.status);
    console.log('📊 Dados:', JSON.stringify(respBairrosNotif.data, null, 2));

    // 3. Testar /casos/bairros (confirmados)
    console.log('\n3️⃣ Testando GET /casos/bairros?ano=2026&se=10&tipo=confirmados');
    const respBairrosConf = await axios.get(`${API_URL}/casos/bairros?ano=2026&se=10&tipo=confirmados`);
    console.log('✅ Status:', respBairrosConf.status);
    console.log('📊 Dados:', JSON.stringify(respBairrosConf.data, null, 2));

    // 4. Testar /casos/serie
    console.log('\n4️⃣ Testando GET /casos/serie?ano=2026&se_inicio=1&se_fim=10');
    const respSerie = await axios.get(`${API_URL}/casos/serie?ano=2026&se_inicio=1&se_fim=10`);
    console.log('✅ Status:', respSerie.status);
    console.log('📊 Total de SEs:', respSerie.data.data.length);
    console.log('📊 SE 10:', respSerie.data.data.find(s => s.semana === 10));

    console.log('\n✅ Todos os testes concluídos!\n');

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Dados:', error.response.data);
    }
  }
}

testAPI();
