// Configurar variáveis de ambiente
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_PORT = process.env.DB_PORT || '3306';
process.env.DB_NAME = process.env.DB_NAME || 'sigls_db';
process.env.DB_USER = process.env.DB_USER || 'sigls_user';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'sigls_secure_password_2025';

const mysql = require('mysql2/promise');

// Dados dos horários de atendimento
const horariosData = [
  { cnes: '2559498', horario: 'Segunda a Sexta-feira, das 7h às 17h.' },
  { cnes: '7836546', horario: 'Segunda a Sexta-feira, das 07h às 11h e 13h às 17h' },
  { cnes: '0148636', horario: 'Segunda a Sexta-feira, das 07h às 11h e 13h às 17h e Sábado das 13h às 17h.' },
  { cnes: '9191801', horario: 'Segunda a Sexta-feira, das 07h às 11h e 13h às 17h' },
  { cnes: '6356486', horario: 'Segunda a Sexta-feira, das 7h às 17h.' },
  { cnes: '2536676', horario: 'Segunda a Sexta-feira, das 7h às 17h.' },
  { cnes: '7665199', horario: 'Sempre aberto.' },
  { cnes: '7789386', horario: 'Segunda a Sexta-feira, das 7h às 15h.' },
  { cnes: '2676818', horario: 'Segunda a Sexta-feira, das 7h às 17h e Sábado das 07h às 11h.' },
  { cnes: '2376156', horario: 'Sempre aberto' },
  { cnes: '2376520', horario: 'Segunda a Sexta-feira, das 7h às 17h.' },
  { cnes: '2599511', horario: 'Segunda a Sexta-feira, das 7h às 23h e Sábado das 07h às 12h.' },
  { cnes: '2603470', horario: 'Segunda a Sexta-feira, das 7h às 17h.' },
  { cnes: '2591553', horario: 'Segunda a Sexta-feira, das 7h às 17h.' },
  { cnes: '6921124', horario: 'Segunda a Sexta-feira, das 7h às 21h.' },
  { cnes: '6585426', horario: 'Segunda a Sexta-feira, das 7h às 17h.' },
  { cnes: '6587720', horario: 'Segunda a Sexta-feira, das 7h às 17h.' },
  { cnes: '2376121', horario: 'Segunda a Sexta-feira, das 7h às 17h.' },
  { cnes: '2376105', horario: 'Segunda a Sexta-feira, das 7h às 17h.' },
  { cnes: '2376148', horario: 'Segunda a Sexta-feira, das 7h às 17h.' },
  { cnes: '2376512', horario: 'Segunda a Sexta-feira, das 7h às 17h.' },
  { cnes: '2536684', horario: 'Segunda a Sexta-feira, das 7h às 17h.' },
  { cnes: '2558815', horario: 'Sempre aberto' },
  { cnes: '2591405', horario: 'Segunda a Sexta-feira, das 7h às 17h.' },
  { cnes: '2676796', horario: 'Segunda a Sexta-feira, das 7h às 17h.' },
  { cnes: '7570643', horario: 'Segunda a Sexta-feira, das 7h às 15h.' },
  { cnes: '7573170', horario: 'Segunda a Sexta-feira, das 7h às 17h.' },
  { cnes: '7575297', horario: 'Segunda a Sexta-feira, das 7h às 18h.' },
  { cnes: '7575300', horario: 'Segunda a Sexta-feira, das 7h às 18h e Sábado das 7h às 12h.' },
  { cnes: '6091458', horario: 'Segunda a Sexta-feira, das 7h às 17h.' },
  { cnes: '6029043', horario: 'Segunda a Sexta-feira, das 7h às 17h.' },
  { cnes: '6564070', horario: 'Segunda a Sexta-feira, das 7h às 17h.' },
  { cnes: '2558742', horario: 'Segunda a Sexta-feira, das 7h às 17h.' },
  { cnes: '7320108', horario: 'Segunda a Sexta-feira, das 7h às 17h.' },
  { cnes: '0456462', horario: 'Segunda a Sexta-feira, das 07h às 11h e 13h às 17h' },
  { cnes: '6590209', horario: 'Segunda a Sexta-feira, das 7h às 17h.' },
  { cnes: '6201385', horario: 'Sempre aberto' },
  { cnes: '3043770', horario: 'Segunda a Sexta-feira, das 7h às 17h.' },
  { cnes: '2558726', horario: 'Segunda a Sexta-feira, das 7h às 17h.' },
  { cnes: '3733300', horario: 'Segunda a Sexta-feira, das 7h às 17h.' },
];

async function atualizarHorarios() {
  let connection;
  
  try {
    // Criar conexão com o banco
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('🔄 Iniciando atualização dos horários de atendimento...\n');

    let atualizados = 0;
    let naoEncontrados = 0;

    for (const item of horariosData) {
      try {
        // Buscar unidade pelo CNES (no id_origem)
        const [rows] = await connection.execute(
          'SELECT id, nome FROM prod_unidade_saude WHERE id_origem = ?',
          [item.cnes]
        );

        if (rows.length === 0) {
          console.log(`❌ Unidade CNES ${item.cnes} não encontrada`);
          naoEncontrados++;
          continue;
        }

        const unidade = rows[0];

        // Atualizar horário de atendimento
        await connection.execute(
          'UPDATE prod_unidade_saude SET horario_atendimento = ? WHERE id = ?',
          [item.horario, unidade.id]
        );

        console.log(`✅ Atualizado CNES ${item.cnes}: ${unidade.nome}`);
        atualizados++;

      } catch (error) {
        console.log(`❌ Erro ao atualizar CNES ${item.cnes}: ${error.message}`);
      }
    }

    console.log('\n📊 Resumo:');
    console.log(`   ✅ Atualizadas: ${atualizados}`);
    console.log(`   ❌ Não encontradas: ${naoEncontrados}`);
    console.log(`   📝 Total: ${horariosData.length}`);

  } catch (error) {
    console.error('❌ Erro na conexão com o banco:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

atualizarHorarios();
