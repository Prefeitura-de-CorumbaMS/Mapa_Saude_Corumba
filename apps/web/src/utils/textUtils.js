/**
 * Normaliza texto removendo acentos e convertendo para lowercase
 * Útil para buscas que devem ignorar acentuação
 *
 * @param {string} text - Texto a ser normalizado
 * @returns {string} Texto normalizado sem acentos e em lowercase
 *
 * @example
 * normalizeText('José') // retorna 'jose'
 * normalizeText('São Paulo') // retorna 'sao paulo'
 * normalizeText('Ênio') // retorna 'enio'
 */
export const normalizeText = (text) => {
  if (!text) return '';
  return text
    .normalize('NFD') // Decompõe caracteres Unicode (separa letra do acento)
    .replace(/[\u0300-\u036f]/g, '') // Remove marcas diacríticas (acentos)
    .toLowerCase()
    .trim();
};
