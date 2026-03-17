const { PrismaClient } = require('@sigls/database')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

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
]

async function main() {
  console.log('🔄 Iniciando atualização dos horários de atendimento...\n')

  let atualizadas = 0
  let naoEncontradas = 0

  for (const item of horariosData) {
    try {
      // Buscar unidade pelo CNES
      const unidade = await prisma.unidade.findFirst({
        where: { cnes: item.cnes }
      })

      if (!unidade) {
        console.log(`❌ Unidade CNES ${item.cnes} não encontrada`)
        naoEncontradas++
        continue
      }

      // Atualizar horário de atendimento
      await prisma.unidade.update({
        where: { id: unidade.id },
        data: { horario_atendimento: item.horario }
      })

      console.log(`✅ ${unidade.nome} - Horário atualizado`)
      atualizadas++
    } catch (error) {
      console.error(`❌ Erro ao atualizar CNES ${item.cnes}:`, error.message)
    }
  }

  console.log(`\n📊 Resumo:`)
  console.log(`   ✅ Atualizadas: ${atualizadas}`)
  console.log(`   ❌ Não encontradas: ${naoEncontradas}`)
  console.log(`   📝 Total: ${horariosData.length}`)
}

main()
  .catch((e) => {
    console.error('Erro:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
