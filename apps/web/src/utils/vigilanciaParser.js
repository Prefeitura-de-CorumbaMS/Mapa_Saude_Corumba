/**
 * Parser de dados de vigilância epidemiológica
 * Converte dados colados do Excel (TSV/CSV) em formato adequado para importação
 */

/**
 * Parseia dados da aba NOTIFICADOS (matriz bairro × SE)
 *
 * Estrutura esperada:
 * Linha 1: Título
 * Linha 2: Subtítulo
 * Linha 3: (vazio)
 * Linha 4: SEMANA | 1 | 1 | 1 | 2 | 2 | 2 | ... | 52 | 52 | 52
 * Linha 5: BAIRRO | N | P | D | N | P | D | ... | N  | P  | D
 * Linha 6+: Nome do Bairro | valores...
 *
 * @param {string} textData - Texto colado do Excel (TSV)
 * @param {number} seInicial - SE inicial para filtrar
 * @param {number} seFinal - SE final para filtrar
 * @returns {Array} Array de objetos { bairro, se, notificados, confirmados, descartados }
 */
export function parseNotificados(textData, seInicial, seFinal) {
  try {
    const linhas = textData.trim().split('\n')

    if (linhas.length < 2) {
      throw new Error('Dados insuficientes. Copie ao menos 2 linhas da planilha (incluindo cabeçalhos)')
    }

    // Detectar separador (tab ou ponto-e-vírgula)
    const separador = linhas[0].includes('\t') ? '\t' : ';'

    // Encontrar linha com "SEMANA" ou com números de SE (linha de semanas)
    let indiceLinhaSemanas = -1
    let indiceLinhaTipos = -1

    for (let i = 0; i < Math.min(5, linhas.length); i++) {
      const linha = linhas[i]
      const colunas = linha.split(separador)

      // Procurar linha que contém SEMANA ou números de 1 a 53
      if (linha.includes('SEMANA') || (colunas.length > 3 && !isNaN(parseInt(colunas[1])))) {
        indiceLinhaSemanas = i
        break
      }
    }

    if (indiceLinhaSemanas === -1) {
      throw new Error('Não foi possível encontrar a linha de semanas epidemiológicas. Certifique-se de copiar os cabeçalhos.')
    }

    // A linha seguinte deve conter BAIRRO, N, P, D
    indiceLinhaTipos = indiceLinhaSemanas + 1

    if (indiceLinhaTipos >= linhas.length) {
      throw new Error('Não foi possível encontrar a linha de tipos (N, P, D).')
    }

    // Linha de semanas epidemiológicas (mantém todas as colunas)
    const colunasLinhaSemanas = linhas[indiceLinhaSemanas].split(separador)

    // Linha de tipos (N, P, D) (mantém todas as colunas)
    const colunasLinhaTipos = linhas[indiceLinhaTipos].split(separador)

    // Mapear índices de colunas para cada SE dentro do intervalo
    const mapeamentoColunas = []

    // Começa do índice 1 (pula a primeira coluna que é "SEMANA" ou "BAIRRO")
    for (let i = 1; i < colunasLinhaSemanas.length; i += 3) {
      const seStr = colunasLinhaSemanas[i]?.trim()
      if (!seStr) continue

      const se = parseInt(seStr)

      if (isNaN(se)) continue
      if (se < seInicial || se > seFinal) continue

      // Verifica se as próximas 2 colunas são P e D
      const tipoN = colunasLinhaTipos[i]?.trim()
      const tipoP = colunasLinhaTipos[i + 1]?.trim()
      const tipoD = colunasLinhaTipos[i + 2]?.trim()

      if (tipoN === 'N' && tipoP === 'P' && tipoD === 'D') {
        mapeamentoColunas.push({
          se,
          indiceN: i,     // Índice da coluna N
          indiceP: i + 1, // Índice da coluna P
          indiceD: i + 2, // Índice da coluna D
        })
      }
    }

    if (mapeamentoColunas.length === 0) {
      throw new Error(`Nenhuma SE encontrada no intervalo ${seInicial}-${seFinal}`)
    }

    console.log('📊 Mapeamento de colunas:', mapeamentoColunas)
    console.log('📍 Índice linha semanas:', indiceLinhaSemanas)
    console.log('📍 Índice linha tipos:', indiceLinhaTipos)
    console.log('📍 Total de linhas:', linhas.length)

    // Parse dados de bairros (começa logo após a linha de tipos)
    const resultado = []

    for (let i = indiceLinhaTipos + 1; i < linhas.length; i++) {
      const colunas = linhas[i].split(separador)
      const bairro = colunas[0]?.trim()

      // Pular linhas vazias ou com nome de bairro inválido
      if (!bairro || bairro === '' || bairro.toUpperCase() === 'TOTAL') {
        continue
      }

      // Extrair dados para cada SE mapeada
      for (const map of mapeamentoColunas) {
        const notificados = parseInt(colunas[map.indiceN]) || 0
        const confirmados = parseInt(colunas[map.indiceP]) || 0
        const descartados = parseInt(colunas[map.indiceD]) || 0

        resultado.push({
          bairro,
          se: map.se,
          notificados,
          confirmados,
          descartados,
        })
      }
    }

    console.log('✅ Total de registros parseados:', resultado.length)
    console.log('📊 Primeiros 3 registros:', resultado.slice(0, 3))

    // Calcular total da SE 1 para debug
    const totalSE1 = resultado
      .filter(r => r.se === 1)
      .reduce((sum, r) => sum + r.notificados, 0)
    console.log('🔍 Total SE 1 (debug):', totalSE1)

    return resultado

  } catch (error) {
    throw new Error(`Erro ao parsear dados: ${error.message}`)
  }
}

/**
 * Parseia dados de perfil demográfico
 *
 * Formato esperado (CSV/TSV):
 * SE,Faixa Etária,Sexo,Casos
 * 1,< 2 anos,F,5
 * 1,< 2 anos,M,3
 *
 * @param {string} textData - Texto colado (CSV/TSV)
 * @returns {Array} Array de objetos { se, faixa_etaria, sexo, casos }
 */
export function parsePerfil(textData) {
  try {
    const linhas = textData.trim().split('\n')

    if (linhas.length < 2) {
      throw new Error('Dados insuficientes. Copie ao menos 2 linhas (cabeçalho + dados)')
    }

    // Detectar separador
    const separador = linhas[0].includes('\t') ? '\t' : ','

    // Primeira linha é cabeçalho (ignorar)
    const resultado = []

    for (let i = 1; i < linhas.length; i++) {
      const colunas = linhas[i].split(separador)

      if (colunas.length < 4) continue

      const se = parseInt(colunas[0]?.trim())
      const faixa_etaria = colunas[1]?.trim()
      const sexo = colunas[2]?.trim().toUpperCase()
      const casos = parseInt(colunas[3]?.trim()) || 0

      if (!isNaN(se) && faixa_etaria && (sexo === 'F' || sexo === 'M')) {
        resultado.push({
          se,
          faixa_etaria,
          sexo,
          casos,
        })
      }
    }

    if (resultado.length === 0) {
      throw new Error('Nenhum registro válido encontrado')
    }

    return resultado

  } catch (error) {
    throw new Error(`Erro ao parsear perfil: ${error.message}`)
  }
}

/**
 * Parseia KPIs da SE (sorotipos, óbitos, isolamentos)
 *
 * Formato esperado:
 * SE,Notificados,Confirmados,Tipo1,Tipo2,Tipo3,Tipo4,Isolamentos,Óbitos
 * 1,45,12,8,3,1,0,2,0
 *
 * @param {string} textData - Texto colado (CSV/TSV)
 * @returns {Array} Array de objetos com KPIs por SE
 */
export function parseKPIs(textData) {
  try {
    const linhas = textData.trim().split('\n')

    if (linhas.length < 2) {
      throw new Error('Dados insuficientes')
    }

    const separador = linhas[0].includes('\t') ? '\t' : ','
    const resultado = []

    for (let i = 1; i < linhas.length; i++) {
      const colunas = linhas[i].split(separador)

      if (colunas.length < 9) continue

      const se = parseInt(colunas[0]?.trim())

      if (isNaN(se)) continue

      resultado.push({
        se,
        notificados: parseInt(colunas[1]) || 0,
        confirmados: parseInt(colunas[2]) || 0,
        tipo1: parseInt(colunas[3]) || 0,
        tipo2: parseInt(colunas[4]) || 0,
        tipo3: parseInt(colunas[5]) || 0,
        tipo4: parseInt(colunas[6]) || 0,
        isolamentos: parseInt(colunas[7]) || 0,
        obitos: parseInt(colunas[8]) || 0,
      })
    }

    if (resultado.length === 0) {
      throw new Error('Nenhum registro válido encontrado')
    }

    return resultado

  } catch (error) {
    throw new Error(`Erro ao parsear KPIs: ${error.message}`)
  }
}

/**
 * Valida dados parseados antes de enviar ao backend
 *
 * @param {Array} dadosParsed - Dados já parseados
 * @param {string} tipo - Tipo de dado ('notificados', 'perfil', 'kpis')
 * @param {Array} bairrosCadastrados - Lista de bairros válidos (opcional)
 * @returns {Object} { valido, erros[], avisos[], estatisticas }
 */
export function validarDados(dadosParsed, tipo, bairrosCadastrados = []) {
  const erros = []
  const avisos = []

  if (!Array.isArray(dadosParsed) || dadosParsed.length === 0) {
    erros.push('Nenhum dado foi parseado. Verifique o formato.')
    return {
      valido: false,
      erros,
      avisos,
      estatisticas: { total: 0, validos: 0, invalidos: 0 },
    }
  }

  if (tipo === 'notificados') {
    // Validar SE dentro do range
    const sesInvalidas = dadosParsed.filter(d => d.se < 1 || d.se > 53)
    if (sesInvalidas.length > 0) {
      erros.push(`${sesInvalidas.length} registros com SE inválida (deve estar entre 1 e 53)`)
    }

    // Validar valores não-negativos
    const valoresNegativos = dadosParsed.filter(d =>
      d.notificados < 0 || d.confirmados < 0 || d.descartados < 0
    )
    if (valoresNegativos.length > 0) {
      erros.push(`${valoresNegativos.length} registros com valores negativos`)
    }

    // Validar bairros (apenas aviso, não bloqueia)
    if (bairrosCadastrados.length > 0) {
      const bairrosUnicos = [...new Set(dadosParsed.map(d => d.bairro))]
      const bairrosInvalidos = bairrosUnicos.filter(b =>
        !bairrosCadastrados.some(bc => bc.toLowerCase() === b.toLowerCase())
      )

      if (bairrosInvalidos.length > 0) {
        avisos.push(
          `${bairrosInvalidos.length} bairros não encontrados no cadastro: ${bairrosInvalidos.slice(0, 5).join(', ')}${bairrosInvalidos.length > 5 ? '...' : ''}`
        )
      }
    }

    // Validar duplicatas
    const chavesUnicas = new Set()
    const duplicatas = []

    for (const registro of dadosParsed) {
      const chave = `${registro.se}-${registro.bairro}`
      if (chavesUnicas.has(chave)) {
        duplicatas.push(`SE ${registro.se}, Bairro ${registro.bairro}`)
      }
      chavesUnicas.add(chave)
    }

    if (duplicatas.length > 0) {
      erros.push(
        `${duplicatas.length} registros duplicados: ${duplicatas.slice(0, 3).join('; ')}${duplicatas.length > 3 ? '...' : ''}`
      )
    }
  }

  if (tipo === 'perfil') {
    // Validar faixas etárias padronizadas
    const faixasValidas = ['< 2 anos', '2 a 4', '5 a 9', '10 a 19', '20 a 29', '30 a 39', '40 a 49', '50 a 59', '60+']
    const faixasInvalidas = dadosParsed.filter(d => !faixasValidas.includes(d.faixa_etaria))

    if (faixasInvalidas.length > 0) {
      avisos.push(
        `${faixasInvalidas.length} registros com faixa etária não padronizada. Use: ${faixasValidas.join(', ')}`
      )
    }

    // Validar sexo
    const sexosInvalidos = dadosParsed.filter(d => d.sexo !== 'F' && d.sexo !== 'M')
    if (sexosInvalidos.length > 0) {
      erros.push(`${sexosInvalidos.length} registros com sexo inválido (use F ou M)`)
    }
  }

  const estatisticas = {
    total: dadosParsed.length,
    validos: dadosParsed.length - erros.length,
    invalidos: erros.length,
    sesUnicas: [...new Set(dadosParsed.map(d => d.se))].length,
  }

  if (tipo === 'notificados') {
    estatisticas.bairrosUnicos = [...new Set(dadosParsed.map(d => d.bairro))].length
  }

  return {
    valido: erros.length === 0,
    erros,
    avisos,
    estatisticas,
  }
}

/**
 * Função auxiliar para detectar o tipo de dado automaticamente
 *
 * @param {string} textData - Texto colado
 * @returns {string} 'notificados', 'perfil', 'kpis' ou 'desconhecido'
 */
export function detectarTipoDado(textData) {
  const primeiraLinha = textData.trim().split('\n')[0]

  if (primeiraLinha.includes('SEMANA') || primeiraLinha.includes('BAIRRO')) {
    return 'notificados'
  }

  if (primeiraLinha.toLowerCase().includes('faixa') && primeiraLinha.toLowerCase().includes('sexo')) {
    return 'perfil'
  }

  if (primeiraLinha.toLowerCase().includes('sorotipo') || primeiraLinha.toLowerCase().includes('isolamento')) {
    return 'kpis'
  }

  return 'desconhecido'
}
