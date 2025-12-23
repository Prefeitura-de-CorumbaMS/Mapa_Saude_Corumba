const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { buildDatabaseUrl } = require('../packages/database/build-database-url');
const mysql = require('mysql2/promise');

const SERVICOS_CENTRO_REGULACAO = [
  'Liberação de Exames Laboratoriais Não Realizados pelo Município',
  'Solicitação e Agendamento de Exames e Consultas via Sisreg (Corumbá e Campo Grande)',
  'Busca e Entrega Presencial de Resultados de Exames ou Agendamentos em Campo Grande',
  'Gerenciamento da Casa de Apoio em Campo Grande (Hospedagem, Alimentação e Transporte)',
  'Controle e Liberação de Traslado Intermunicipal',
  'Solicitação de Transporte Especial (Ambulância) para Consultas ou Procedimentos em Campo Grande',
  'Solicitação de Ambulância para Retorno de Pacientes de Alta Hospitalar em Campo Grande',
  'Dispensação e Controle de Passagens para Pacientes e Acompanhantes com Procedimentos TFD em Campo Grande',
  'Acompanhamento de Pacientes com Atendimento na FUNCRAF (Fundação para Estudo e Tratamento das Deformidades Craniofaciais)',
  'Atendimento Ambulatorial Municipal e Intermunicipal pelo TFD',
  'Telemedicina',
  'Geriatria',
  'Ouvidoria do SUS',
  'Assistência Farmacêutica',
];

async function populateServicos() {
  const conn = await mysql.createConnection(buildDatabaseUrl());

  try {
    console.log('\n' + '='.repeat(80));
    console.log('POPULAÇÃO DE SERVIÇOS - CENTRO DE REGULAÇÃO DO MUNICÍPIO');
    console.log('='.repeat(80));
    console.log();

    // Buscar o Centro de Regulação
    const [unidades] = await conn.execute(
      'SELECT id, nome FROM prod_unidade_saude WHERE nome LIKE ?',
      ['%Centro de Regulação%']
    );

    if (unidades.length === 0) {
      console.log('❌ Centro de Regulação não encontrado no banco de dados');
      console.log('Por favor, verifique o nome correto da unidade');
      return;
    }

    const centroRegulacao = unidades[0];
    console.log(`✓ Unidade encontrada: ${centroRegulacao.nome} (ID: ${centroRegulacao.id})`);
    console.log();

    // Verificar se já existem serviços cadastrados
    const [servicosExistentes] = await conn.execute(
      'SELECT COUNT(*) as total FROM prod_unidade_servico WHERE id_unidade = ?',
      [centroRegulacao.id]
    );

    if (servicosExistentes[0].total > 0) {
      console.log(`⚠ Já existem ${servicosExistentes[0].total} serviço(s) cadastrado(s) para esta unidade`);
      console.log('Removendo serviços existentes para recadastrar...\n');

      await conn.execute(
        'DELETE FROM prod_unidade_servico WHERE id_unidade = ?',
        [centroRegulacao.id]
      );
    }

    // Criar os serviços
    console.log('📝 CRIANDO SERVIÇOS:\n');

    for (let i = 0; i < SERVICOS_CENTRO_REGULACAO.length; i++) {
      const descricao = SERVICOS_CENTRO_REGULACAO[i];

      await conn.execute(
        'INSERT INTO prod_unidade_servico (id_unidade, descricao, ordem, ativo, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
        [centroRegulacao.id, descricao, i + 1, true]
      );

      console.log(`   ${i + 1}. ✓ ${descricao}`);
    }

    console.log();
    console.log('='.repeat(80));
    console.log(`✓ ${SERVICOS_CENTRO_REGULACAO.length} serviços criados com sucesso!`);
    console.log('='.repeat(80));
    console.log();

  } catch (error) {
    console.error('\n❌ Erro ao popular serviços:', error.message);
    throw error;
  } finally {
    await conn.end();
  }
}

populateServicos()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
