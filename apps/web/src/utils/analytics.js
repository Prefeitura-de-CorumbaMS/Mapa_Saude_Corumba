/**
 * Analytics próprio — Helper de Eventos
 *
 * Envia eventos para a API interna /api/analytics/event.
 * Não usa mais Google Analytics.
 */

const ENDPOINT = '/api/analytics/event';

/**
 * Envia um evento para a API de analytics usando sendBeacon (fire-and-forget).
 * Faz fallback para fetch caso sendBeacon não esteja disponível.
 */
function sendEvent(tipo, dados) {
  const payload = JSON.stringify({ tipo, dados });

  // sendBeacon é ideal para page_view (não bloqueia o unload)
  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    const blob = new Blob([payload], { type: 'application/json' });
    navigator.sendBeacon(ENDPOINT, blob);
    return;
  }

  // Fallback: fetch silencioso — não lança erros para não afetar UX
  fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
    keepalive: true,
  }).catch(() => {});
}

// ============================================================================
// Funções publicas — mesmos nomes das anteriores para zero impacto nos call sites
// ============================================================================

export const trackPageView = () => {
  sendEvent('page_view', {});
};

export const trackBusca = ({ tipo, termo, resultados = 0 }) => {
  sendEvent('busca_realizada', {
    tipo_busca: tipo,
    termo,
    resultados,
  });
};

export const trackVisualizacaoUnidade = ({ unidadeId, unidadeNome, origem = 'mapa' }) => {
  sendEvent('visualizacao_unidade', {
    unidade_id: unidadeId,
    unidade_nome: unidadeNome,
    origem,
  });
};

export const trackCliqueMapaUnidade = ({ unidadeId, unidadeNome }) => {
  sendEvent('clique_mapa', {
    unidade_id: unidadeId,
    unidade_nome: unidadeNome,
  });
};

export const trackContatoUnidade = ({ tipo, unidadeId, unidadeNome }) => {
  sendEvent('contato_unidade', {
    tipo_contato: tipo,
    unidade_id: unidadeId,
    unidade_nome: unidadeNome,
  });
};

export const trackRedeSocialUnidade = ({ redeSocial, unidadeId, unidadeNome }) => {
  sendEvent('rede_social', {
    rede_social: redeSocial,
    unidade_id: unidadeId,
    unidade_nome: unidadeNome,
  });
};

export const trackFiltroMapa = ({ tipoFiltro, valorFiltro, resultados = 0 }) => {
  sendEvent('filtro_aplicado', {
    tipo_filtro: tipoFiltro,
    valor_filtro: valorFiltro,
    resultados,
  });
};

export const trackLegendaAberta = () => {
  sendEvent('legenda_aberta', {});
};

// Mantidos para compatibilidade com eventuais call sites — sem efeito colateral
export const trackAbrirPopup = () => {};
export const trackAcessoAdmin = () => {};
export const trackErro = () => {};

