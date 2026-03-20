/**
 * Calendário de Semanas Epidemiológicas de 2026
 *
 * Regras:
 * - A semana epidemiológica inicia sempre no domingo
 * - A 1ª semana inicia no primeiro domingo do ano
 * - Os primeiros dias do ano, se não for domingo, pertencem à última SE do ano anterior
 * - Cada SE tem 7 dias (domingo a sábado)
 */

export const CALENDARIO_EPIDEMIOLOGICO_2026 = {
  1: { inicio: '04/01/2026', termino: '10/01/2026' },
  2: { inicio: '11/01/2026', termino: '17/01/2026' },
  3: { inicio: '18/01/2026', termino: '24/01/2026' },
  4: { inicio: '25/01/2026', termino: '31/01/2026' },
  5: { inicio: '01/02/2026', termino: '07/02/2026' },
  6: { inicio: '08/02/2026', termino: '14/02/2026' },
  7: { inicio: '15/02/2026', termino: '21/02/2026' },
  8: { inicio: '22/02/2026', termino: '28/02/2026' },
  9: { inicio: '01/03/2026', termino: '07/03/2026' },
  10: { inicio: '08/03/2026', termino: '14/03/2026' },
  11: { inicio: '15/03/2026', termino: '21/03/2026' },
  12: { inicio: '22/03/2026', termino: '28/03/2026' },
  13: { inicio: '29/03/2026', termino: '04/04/2026' },
  14: { inicio: '05/04/2026', termino: '11/04/2026' },
  15: { inicio: '12/04/2026', termino: '18/04/2026' },
  16: { inicio: '19/04/2026', termino: '25/04/2026' },
  17: { inicio: '26/04/2026', termino: '02/05/2026' },
  18: { inicio: '03/05/2026', termino: '09/05/2026' },
  19: { inicio: '10/05/2026', termino: '16/05/2026' },
  20: { inicio: '17/05/2026', termino: '23/05/2026' },
  21: { inicio: '24/05/2026', termino: '30/05/2026' },
  22: { inicio: '31/05/2026', termino: '06/06/2026' },
  23: { inicio: '07/06/2026', termino: '13/06/2026' },
  24: { inicio: '14/06/2026', termino: '20/06/2026' },
  25: { inicio: '21/06/2026', termino: '27/06/2026' },
  26: { inicio: '28/06/2026', termino: '04/07/2026' },
  27: { inicio: '05/07/2026', termino: '11/07/2026' },
  28: { inicio: '12/07/2026', termino: '18/07/2026' },
  29: { inicio: '19/07/2026', termino: '25/07/2026' },
  30: { inicio: '26/07/2026', termino: '01/08/2026' },
  31: { inicio: '02/08/2026', termino: '08/08/2026' },
  32: { inicio: '09/08/2026', termino: '15/08/2026' },
  33: { inicio: '16/08/2026', termino: '22/08/2026' },
  34: { inicio: '23/08/2026', termino: '29/08/2026' },
  35: { inicio: '30/08/2026', termino: '05/09/2026' },
  36: { inicio: '06/09/2026', termino: '12/09/2026' },
  37: { inicio: '13/09/2026', termino: '19/09/2026' },
  38: { inicio: '20/09/2026', termino: '26/09/2026' },
  39: { inicio: '27/09/2026', termino: '03/10/2026' },
  40: { inicio: '04/10/2026', termino: '10/10/2026' },
  41: { inicio: '11/10/2026', termino: '17/10/2026' },
  42: { inicio: '18/10/2026', termino: '24/10/2026' },
  43: { inicio: '25/10/2026', termino: '31/10/2026' },
  44: { inicio: '01/11/2026', termino: '07/11/2026' },
  45: { inicio: '08/11/2026', termino: '14/11/2026' },
  46: { inicio: '15/11/2026', termino: '21/11/2026' },
  47: { inicio: '22/11/2026', termino: '28/11/2026' },
  48: { inicio: '29/11/2026', termino: '05/12/2026' },
  49: { inicio: '06/12/2026', termino: '12/12/2026' },
  50: { inicio: '13/12/2026', termino: '19/12/2026' },
  51: { inicio: '20/12/2026', termino: '26/12/2026' },
  52: { inicio: '27/12/2026', termino: '02/01/2027' },
};

/**
 * Retorna as datas de início e término de uma SE
 * @param {number} se - Número da semana epidemiológica (1-52)
 * @param {number} ano - Ano (atualmente apenas 2026)
 * @returns {Object} - { inicio, termino } ou null se não encontrado
 */
export function getPeriodoSE(se, ano = 2026) {
  if (ano !== 2026) {
    return null; // Por enquanto só temos calendário de 2026
  }

  return CALENDARIO_EPIDEMIOLOGICO_2026[se] || null;
}

/**
 * Retorna período formatado: "04/01 a 10/01/2026"
 * @param {number} se - Número da semana epidemiológica
 * @param {number} ano - Ano
 * @returns {string} - Período formatado
 */
export function getPeriodoFormatado(se, ano = 2026) {
  const periodo = getPeriodoSE(se, ano);
  if (!periodo) return '';

  return `${periodo.inicio} a ${periodo.termino}`;
}

/**
 * Retorna período curto: "04/01 a 10/01"
 * @param {number} se - Número da semana epidemiológica
 * @param {number} ano - Ano
 * @returns {string} - Período formatado curto
 */
export function getPeriodoCurto(se, ano = 2026) {
  const periodo = getPeriodoSE(se, ano);
  if (!periodo) return '';

  // Pega só dia/mês do término
  const terminoCurto = periodo.termino.substring(0, 5);
  return `${periodo.inicio} a ${terminoCurto}`;
}

/**
 * Explicação sobre Semanas Epidemiológicas
 */
export const EXPLICACAO_SE = {
  titulo: 'O que é Semana Epidemiológica?',
  texto: `A Semana Epidemiológica (SE) é um sistema padronizado de contagem de semanas usado em vigilância epidemiológica no Brasil e no mundo. Cada SE tem 7 dias e sempre começa no domingo e termina no sábado.`,
  regras: [
    'A semana epidemiológica sempre inicia no domingo',
    'A 1ª semana do ano inicia no primeiro domingo do ano',
    'Os primeiros dias do ano (antes do primeiro domingo) pertencem à última SE do ano anterior',
    'Cada ano tem 52 ou 53 semanas epidemiológicas',
  ],
  exemplo: 'Por exemplo, em 2026, o primeiro domingo é 04/01, então a SE 01 vai de 04/01 a 10/01. Os dias 01, 02 e 03 de janeiro pertencem à SE 52 de 2025.',
};
