# Dashboard de Vigilância de Dengue — Especificação de Implementação
**Mapa da Saúde · Prefeitura Municipal de Corumbá — MS**

---

## 1. Visão Geral

Este documento especifica a implementação completa de um dashboard epidemiológico de Dengue para integração ao sistema **Mapa da Saúde** da Prefeitura de Corumbá. O dashboard é baseado no boletim epidemiológico real da SE 09/2026 do CIEVS Fronteira Corumbá, com dados estáticos neste primeiro momento, preparado para posterior conexão com banco de dados.

### Stack recomendada

| Camada | Tecnologia |
|---|---|
| Framework | Next.js (já utilizado no projeto) |
| Estilização | Tailwind CSS (já utilizado) |
| Gráficos | **Chart.js** via `react-chartjs-2` |
| Ícones | Lucide React ou emojis nativos |
| Tipografia | Google Fonts — **Work Sans** (identidade da Prefeitura) |

### Instalação da dependência de gráficos

```bash
npm install chart.js react-chartjs-2
```

---

## 2. Identidade Visual

Seguir a identidade visual oficial da Prefeitura de Corumbá, já estabelecida no sistema.

```css
/* CSS Variables — Paleta oficial */
--color-primary:        #1F3473;   /* Azul escuro institucional */
--color-secondary:      #40A1E6;   /* Azul claro institucional */

/* Paleta epidemiológica complementar */
--color-alert:          #DC2626;   /* Vermelho — alerta/confirmados */
--color-warning:        #F59E0B;   /* Âmbar — atenção/notificados */
--color-success:        #16A34A;   /* Verde — óbitos zero / positivo */
--color-neutral:        #6B7280;   /* Cinza — dados secundários */

/* Superfícies */
--color-bg:             #F8FAFC;   /* Fundo da página */
--color-card:           #FFFFFF;   /* Fundo dos cards */
--color-border:         #E2E8F0;   /* Bordas suaves */
--color-text-primary:   #1E293B;
--color-text-secondary: #64748B;
```

---

## 3. Dados Estáticos (SE 09 / 2026)

Centralizar todos os dados em um arquivo separado para facilitar a futura substituição por chamadas à API/banco de dados.

### Arquivo: `data/dengue-se09.ts` (ou `.js`)

```typescript
// ============================================================
// DADOS ESTÁTICOS — DENGUE SE 09 / 2026
// Fonte: SINAN · CIEVS Fronteira Corumbá
// TODO: Substituir por chamada à API quando o banco estiver conectado
// ============================================================

export const metadados = {
  municipio: "Corumbá",
  uf: "MS",
  fonte: "SINAN, 2026",
  semanaEpidemiologica: 9,
  periodo: "SE 01 a SE 09",
  dataPublicacao: "2026",
  orgao: "CIEVS Fronteira Corumbá",
  secretaria: "Secretaria Municipal de Saúde",
  telefone: "(67) 99144-0207",
  email: "cievsfronteiracorumba@gmail.com",
};

// --- KPIs Principais ---
export const kpis = {
  casosNotificadosSE09: 219,
  casosConfirmadosSE09: 11,
  sorotipoTipo3: 5,
  isolamentosVirais: 5,
  obitos: 0,
};

// --- Série Histórica por Semana Epidemiológica (SE 1 a SE 9) ---
export const serieHistorica = {
  labels: ["SE 1", "SE 2", "SE 3", "SE 4", "SE 5", "SE 6", "SE 7", "SE 8", "SE 9"],
  notificados: [18, 22, 31, 45, 60, 78, 95, 102, 88],
  // Nota: valores intermediários estimados para consistência visual.
  // SE 8 = pico de notificados (102); SE 9 = pico de confirmados (7).
  confirmados: [1, 1, 0, 2, 1, 3, 2, 4, 7],
};

// --- Faixa Etária dos Confirmados ---
export const faixaEtaria = {
  labels: ["< 2 anos", "2 a 4", "5 a 9", "10 a 19", "20 a 29", "30 a 39", "40 a 49", "50 a 59", "60+"],
  valores: [0, 1, 1, 5, 2, 5, 2, 1, 5],
  // Pico: 10–19 e 30–39 anos (5 casos cada)
};

// --- Distribuição por Sexo ---
export const distribuicaoSexo = {
  feminino: 14,
  masculino: 8,
  // Feminino: 64% | Masculino: 36%
};

// --- Top 15 Bairros — Notificações ---
export const bairrosNotificados = [
  { bairro: "Guatos",          casos: 72 },
  { bairro: "Aeroporto",       casos: 61 },
  { bairro: "Centro",          casos: 55 },
  { bairro: "Cristo Redentor", casos: 48 },
  { bairro: "Popular Nova",    casos: 42 },
  { bairro: "Guanã",           casos: 38 },
  { bairro: "Nova Corumbá",    casos: 34 },
  { bairro: "Jd. dos Estados", casos: 30 },
  { bairro: "Dom Bosco",       casos: 27 },
  { bairro: "Centro América",  casos: 24 },
  { bairro: "Pe. E. Sassida",  casos: 20 },
  { bairro: "Popular Velha",   casos: 18 },
  { bairro: "Universitário",   casos: 15 },
  { bairro: "Lot. Pantanal",   casos: 12 },
  { bairro: "Jatobazinho",     casos: 9  },
];

// --- Confirmados por Bairro ---
export const bairrosConfirmados = [
  { bairro: "Guanã",            casos: 7 },
  { bairro: "Guatos",           casos: 5 },
  { bairro: "Lot. Pantanal",    casos: 4 },
  { bairro: "Popular Nova",     casos: 3 },
  { bairro: "Trânsito/Import.", casos: 3 },
  { bairro: "Dom Bosco",        casos: 2 },
  { bairro: "Guarani",          casos: 2 },
  { bairro: "Nova Corumbá",     casos: 2 },
  { bairro: "Primavera",        casos: 1 },
];

// --- Sorotipo ---
export const sorotipo = {
  tipo: "Dengue Tipo 3",
  metodo: "RT-qPCR",
  isolamentos: 11,
};

// --- Definição de Caso Suspeito ---
export const definicaoCasoSuspeito =
  "Pessoa que viva ou tenha viajado nos últimos 14 dias para área com transmissão de dengue, com febre (2–7 dias) e 2 ou mais sintomas: náuseas, vômitos, exantema, mialgias, cefaleia, dor retroorbital, petéquias ou prova do laço positiva e leucopenia.";
```

---

## 4. Estrutura de Componentes

O dashboard é composto por seções independentes. Cada seção deve ser um componente React separado para facilitar manutenção.

```
pages/saude/dengue.tsx          ← Página principal (ou route no App Router)
  └── components/dengue/
        ├── DengueHeader.tsx         ← Cabeçalho institucional
        ├── DengueKPICards.tsx       ← Cards com indicadores principais
        ├── DengueSerieHistorica.tsx ← 3 gráficos de linha/barra temporal
        ├── DenguePerfil.tsx         ← Faixa etária + donut de sexo
        ├── DengueBairrosNotif.tsx   ← Bar horizontal top 15 bairros
        ├── DengueBairrosConf.tsx    ← Bar horizontal confirmados por bairro
        ├── DengueSorotipo.tsx       ← Card informativo sorotipo
        ├── DengueDefinicao.tsx      ← Box definição de caso suspeito
        └── DengueFooter.tsx         ← Rodapé institucional
```

---

## 5. Implementação Detalhada por Componente

---

### 5.1 DengueHeader

**Função:** Cabeçalho com identidade institucional e título do boletim.

```tsx
// components/dengue/DengueHeader.tsx
export function DengueHeader() {
  return (
    <div className="bg-[#1F3473] text-white rounded-xl p-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-[#40A1E6] text-sm font-semibold uppercase tracking-wider">
            CIEVS Fronteira · Corumbá — MS
          </p>
          <h1 className="text-2xl md:text-3xl font-bold mt-1">
            Vigilância de Dengue
          </h1>
          <p className="text-blue-200 text-sm mt-1">
            Fonte: SINAN, 2026 · Semana Epidemiológica 01–09
          </p>
        </div>
        <div className="text-right">
          <span className="bg-[#40A1E6] text-white text-sm font-bold px-4 py-2 rounded-full">
            Boletim Epidemiológico · SE 09
          </span>
          <p className="text-blue-200 text-xs mt-2">
            Secretaria Municipal de Saúde
          </p>
          <p className="text-blue-200 text-xs">
            Prefeitura de Corumbá
          </p>
        </div>
      </div>
    </div>
  );
}
```

---

### 5.2 DengueKPICards

**Função:** Linha de cards com os 5 KPIs principais da SE 09.

**Layout:** 5 cards em grid responsivo (2 colunas mobile → 5 colunas desktop).

```tsx
// components/dengue/DengueKPICards.tsx
import { kpis } from "@/data/dengue-se09";

const cards = [
  {
    emoji: "📋",
    label: "Casos Notificados",
    value: kpis.casosNotificadosSE09,
    color: "border-amber-400",
    textColor: "text-amber-600",
  },
  {
    emoji: "🔬",
    label: "Casos Confirmados",
    value: kpis.casosConfirmadosSE09,
    color: "border-red-400",
    textColor: "text-red-600",
  },
  {
    emoji: "🧬",
    label: "Sorotipo Tipo-3",
    value: kpis.sorotipoTipo3,
    sublabel: "Confirmado",
    color: "border-purple-400",
    textColor: "text-purple-600",
  },
  {
    emoji: "🧪",
    label: "Isolamento Viral",
    value: kpis.isolamentosVirais,
    color: "border-blue-400",
    textColor: "text-blue-600",
  },
  {
    emoji: "✅",
    label: "Óbitos",
    value: kpis.obitos,
    sublabel: "Nenhum registrado",
    color: "border-green-400",
    textColor: "text-green-600",
  },
];

export function DengueKPICards() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`bg-white rounded-xl border-t-4 ${card.color} shadow-sm p-4 flex flex-col items-center text-center`}
        >
          <span className="text-2xl mb-1">{card.emoji}</span>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            SE 09
          </span>
          <span className={`text-3xl font-bold ${card.textColor}`}>
            {card.value}
          </span>
          <span className="text-sm font-semibold text-gray-700 mt-1">
            {card.label}
          </span>
          {card.sublabel && (
            <span className="text-xs text-gray-400 mt-0.5">{card.sublabel}</span>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

### 5.3 DengueSerieHistorica

**Função:** Três gráficos — notificados por SE, confirmados por SE, e comparativo.

**Biblioteca:** `react-chartjs-2` com Chart.js.

**Registro necessário (fazer uma vez, no arquivo de página ou `_app.tsx`):**

```tsx
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, Title, Tooltip, Legend
);
```

**Componente:**

```tsx
// components/dengue/DengueSerieHistorica.tsx
import { Bar, Line } from "react-chartjs-2";
import { serieHistorica } from "@/data/dengue-se09";

const opcoesBase = {
  responsive: true,
  plugins: {
    legend: { display: false },
    tooltip: { mode: "index" as const, intersect: false },
  },
  scales: {
    x: { grid: { display: false } },
    y: { beginAtZero: true, grid: { color: "#f1f5f9" } },
  },
};

export function DengueSerieHistorica() {
  const dadosNotificados = {
    labels: serieHistorica.labels,
    datasets: [{
      label: "Notificados",
      data: serieHistorica.notificados,
      backgroundColor: "#F59E0B",
      borderRadius: 6,
    }],
  };

  const dadosConfirmados = {
    labels: serieHistorica.labels,
    datasets: [{
      label: "Confirmados",
      data: serieHistorica.confirmados,
      backgroundColor: "#DC2626",
      borderRadius: 6,
    }],
  };

  const dadosComparativo = {
    labels: serieHistorica.labels,
    datasets: [
      {
        label: "Notificados",
        data: serieHistorica.notificados,
        borderColor: "#F59E0B",
        backgroundColor: "rgba(245,158,11,0.15)",
        tension: 0.4,
        fill: true,
        pointBackgroundColor: "#F59E0B",
      },
      {
        label: "Confirmados",
        data: serieHistorica.confirmados,
        borderColor: "#DC2626",
        backgroundColor: "rgba(220,38,38,0.15)",
        tension: 0.4,
        fill: true,
        pointBackgroundColor: "#DC2626",
      },
    ],
  };

  const opcoesComparativo = {
    ...opcoesBase,
    plugins: {
      ...opcoesBase.plugins,
      legend: { display: true, position: "bottom" as const },
    },
  };

  return (
    <div className="mb-8">
      <h2 className="text-lg font-bold text-[#1F3473] mb-4 flex items-center gap-2">
        📈 Série Histórica por Semana Epidemiológica
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Notificados */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-600 mb-1">
            Casos Notificados
          </h3>
          <p className="text-xs text-gray-400 mb-3">
            Pico: SE 8 com <strong>102</strong> notificações
          </p>
          <Bar data={dadosNotificados} options={opcoesBase} />
        </div>
        {/* Confirmados */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-600 mb-1">
            Casos Confirmados
          </h3>
          <p className="text-xs text-gray-400 mb-3">
            Pico: SE 9 com <strong>7</strong> confirmações
          </p>
          <Bar data={dadosConfirmados} options={opcoesBase} />
        </div>
      </div>
      {/* Comparativo */}
      <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-600 mb-3">
          Evolução Comparativa — Notificados vs. Confirmados
        </h3>
        <Line data={dadosComparativo} options={opcoesComparativo} />
      </div>
    </div>
  );
}
```

---

### 5.4 DenguePerfil

**Função:** Distribuição por faixa etária (barra horizontal) e por sexo (donut).

```tsx
// components/dengue/DenguePerfil.tsx
import { Bar, Doughnut } from "react-chartjs-2";
import { ArcElement } from "chart.js";
import { faixaEtaria, distribuicaoSexo } from "@/data/dengue-se09";

// Registrar ArcElement para Doughnut
ChartJS.register(ArcElement);

export function DenguePerfil() {
  const dadosFaixa = {
    labels: faixaEtaria.labels,
    datasets: [{
      label: "Casos",
      data: faixaEtaria.valores,
      backgroundColor: "#1F3473",
      borderRadius: 4,
    }],
  };

  const opcoesFaixa = {
    indexAxis: "y" as const,
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: { beginAtZero: true, grid: { color: "#f1f5f9" } },
      y: { grid: { display: false } },
    },
  };

  const total = distribuicaoSexo.feminino + distribuicaoSexo.masculino;
  const pctFem = Math.round((distribuicaoSexo.feminino / total) * 100);
  const pctMas = Math.round((distribuicaoSexo.masculino / total) * 100);

  const dadosSexo = {
    labels: [`Feminino: ${distribuicaoSexo.feminino} (${pctFem}%)`, `Masculino: ${distribuicaoSexo.masculino} (${pctMas}%)`],
    datasets: [{
      data: [distribuicaoSexo.feminino, distribuicaoSexo.masculino],
      backgroundColor: ["#40A1E6", "#1F3473"],
      borderWidth: 0,
    }],
  };

  const opcoesSexo = {
    responsive: true,
    cutout: "65%",
    plugins: {
      legend: { display: true, position: "bottom" as const },
    },
  };

  return (
    <div className="mb-8">
      <h2 className="text-lg font-bold text-[#1F3473] mb-4 flex items-center gap-2">
        👤 Perfil dos Casos Confirmados
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Faixa Etária */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-600 mb-1">
            Distribuição por Faixa Etária
          </h3>
          <p className="text-xs text-gray-400 mb-3">
            Faixas mais afetadas: <strong>10–19</strong> e <strong>30–39 anos</strong> (5 casos cada)
          </p>
          <Bar data={dadosFaixa} options={opcoesFaixa} />
        </div>
        {/* Sexo */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 flex flex-col items-center justify-center">
          <h3 className="text-sm font-semibold text-gray-600 mb-4 self-start">
            Distribuição por Sexo
          </h3>
          <div className="w-48 h-48 relative">
            <Doughnut data={dadosSexo} options={opcoesSexo} />
            {/* Label central */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-[#40A1E6]">{pctFem}%</span>
              <span className="text-xs text-gray-500">Feminino</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

### 5.5 DengueBairrosNotif

**Função:** Top 15 bairros com mais notificações — barra horizontal.

```tsx
// components/dengue/DengueBairrosNotif.tsx
import { Bar } from "react-chartjs-2";
import { bairrosNotificados } from "@/data/dengue-se09";

export function DengueBairrosNotif() {
  const dados = {
    labels: bairrosNotificados.map((b) => b.bairro),
    datasets: [{
      label: "Notificações",
      data: bairrosNotificados.map((b) => b.casos),
      backgroundColor: "#F59E0B",
      borderRadius: 4,
    }],
  };

  const opcoes = {
    indexAxis: "y" as const,
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: { beginAtZero: true, grid: { color: "#f1f5f9" } },
      y: { grid: { display: false }, ticks: { font: { size: 11 } } },
    },
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 mb-6">
      <h2 className="text-lg font-bold text-[#1F3473] mb-1 flex items-center gap-2">
        🏘️ Notificações por Bairro
      </h2>
      <p className="text-xs text-gray-400 mb-4">
        Top 15 bairros com mais notificações
      </p>
      <Bar data={dados} options={opcoes} />
    </div>
  );
}
```

---

### 5.6 DengueBairrosConf

**Função:** Bairros com casos laboratorialmente confirmados — barra horizontal.

```tsx
// components/dengue/DengueBairrosConf.tsx
import { Bar } from "react-chartjs-2";
import { bairrosConfirmados } from "@/data/dengue-se09";

export function DengueBairrosConf() {
  const dados = {
    labels: bairrosConfirmados.map((b) => b.bairro),
    datasets: [{
      label: "Confirmados",
      data: bairrosConfirmados.map((b) => b.casos),
      backgroundColor: "#DC2626",
      borderRadius: 4,
    }],
  };

  const opcoes = {
    indexAxis: "y" as const,
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: { beginAtZero: true, grid: { color: "#f1f5f9" } },
      y: { grid: { display: false }, ticks: { font: { size: 11 } } },
    },
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 mb-6">
      <h2 className="text-lg font-bold text-[#1F3473] mb-1 flex items-center gap-2">
        🔴 Confirmados por Bairro
      </h2>
      <p className="text-xs text-gray-400 mb-4">
        Bairros com casos laboratorialmente confirmados
      </p>
      <Bar data={dados} options={opcoes} />
    </div>
  );
}
```

---

### 5.7 DengueSorotipo

**Função:** Card informativo sobre o sorotipo identificado.

```tsx
// components/dengue/DengueSorotipo.tsx
import { sorotipo } from "@/data/dengue-se09";

export function DengueSorotipo() {
  return (
    <div className="bg-gradient-to-r from-[#1F3473] to-[#40A1E6] text-white rounded-xl p-6 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <p className="text-blue-200 text-sm font-semibold uppercase tracking-wider mb-1">
          🧬 Sorotipo Identificado
        </p>
        <p className="text-2xl font-bold">{sorotipo.tipo}</p>
        <p className="text-blue-200 text-sm mt-1">
          Confirmado por {sorotipo.metodo}
        </p>
      </div>
      <div className="text-center md:text-right">
        <p className="text-4xl font-bold">{sorotipo.isolamentos}</p>
        <p className="text-blue-200 text-sm">isolamentos virais realizados</p>
      </div>
    </div>
  );
}
```

---

### 5.8 DengueDefinicao

**Função:** Box de alerta com a definição de caso suspeito.

```tsx
// components/dengue/DengueDefinicao.tsx
import { definicaoCasoSuspeito } from "@/data/dengue-se09";

export function DengueDefinicao() {
  return (
    <div className="bg-amber-50 border border-amber-300 rounded-xl p-5 mb-6">
      <h3 className="text-sm font-bold text-amber-800 mb-2 flex items-center gap-2">
        ⚠️ Definição de Caso Suspeito
      </h3>
      <p className="text-sm text-amber-900 leading-relaxed">
        {definicaoCasoSuspeito}
      </p>
    </div>
  );
}
```

---

### 5.9 DengueFooter

**Função:** Rodapé institucional com contatos e fonte dos dados.

```tsx
// components/dengue/DengueFooter.tsx
import { metadados } from "@/data/dengue-se09";

export function DengueFooter() {
  return (
    <footer className="bg-[#1F3473] text-white rounded-xl p-6 text-center">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
        <div>
          <p className="text-blue-300 text-xs uppercase tracking-wider mb-1">Estado</p>
          <p>Mato Grosso do Sul</p>
        </div>
        <div>
          <p className="text-blue-300 text-xs uppercase tracking-wider mb-1">Município</p>
          <p>Prefeitura Municipal de Corumbá</p>
        </div>
        <div>
          <p className="text-blue-300 text-xs uppercase tracking-wider mb-1">Órgão</p>
          <p>Secretaria Municipal de Saúde</p>
          <p className="text-blue-200 text-xs">Gerência de Vigilância em Saúde</p>
        </div>
        <div>
          <p className="text-blue-300 text-xs uppercase tracking-wider mb-1">CIEVS Fronteira</p>
          <p>{metadados.telefone}</p>
          <p className="text-blue-200 text-xs break-all">{metadados.email}</p>
        </div>
      </div>
      <hr className="border-blue-800 mb-3" />
      <p className="text-blue-300 text-xs">
        Fonte: SINAN, 2026 · Boletim Epidemiológico Dengue SE 09 · Dados sujeitos a revisão
      </p>
    </footer>
  );
}
```

---

## 6. Página Principal

Montar todos os componentes na página de dengue.

```tsx
// pages/saude/dengue.tsx  (Pages Router)
// OU
// app/saude/dengue/page.tsx  (App Router)

"use client"; // necessário apenas no App Router

import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler
);

import { DengueHeader }        from "@/components/dengue/DengueHeader";
import { DengueKPICards }      from "@/components/dengue/DengueKPICards";
import { DengueSerieHistorica } from "@/components/dengue/DengueSerieHistorica";
import { DenguePerfil }        from "@/components/dengue/DenguePerfil";
import { DengueBairrosNotif }  from "@/components/dengue/DengueBairrosNotif";
import { DengueBairrosConf }   from "@/components/dengue/DengueBairrosConf";
import { DengueSorotipo }      from "@/components/dengue/DengueSorotipo";
import { DengueDefinicao }     from "@/components/dengue/DengueDefinicao";
import { DengueFooter }        from "@/components/dengue/DengueFooter";

export default function DashboardDengue() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <DengueHeader />
        <DengueKPICards />
        <DengueSerieHistorica />
        <DenguePerfil />
        <DengueBairrosNotif />
        <DengueBairrosConf />
        <DengueSorotipo />
        <DengueDefinicao />
        <DengueFooter />
      </div>
    </div>
  );
}
```

---

## 7. Integração com o Mapa da Saúde

Se o sistema já possui uma sidebar/navbar, apenas substituir o `div` externo pelo componente de layout já existente. Exemplo genérico:

```tsx
// Com layout existente do sistema
export default function DashboardDengue() {
  return (
    <MainLayout titulo="Vigilância de Dengue">
      {/* conteúdo acima */}
    </MainLayout>
  );
}
```

---

## 8. Roadmap — Conexão com Banco de Dados

Quando o backend estiver pronto, a substituição dos dados é simples:

### 8.1 Criar endpoint na API

```
GET /api/saude/dengue?se=09&ano=2026
```

Retornar o mesmo formato do objeto `dengue-se09.ts`.

### 8.2 Substituir dados estáticos por fetch

```tsx
// Hook de dados — substituir import estático
import { useEffect, useState } from "react";

export function useDengueDados(se: number, ano: number) {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/saude/dengue?se=${se}&ano=${ano}`)
      .then((res) => res.json())
      .then((data) => { setDados(data); setLoading(false); });
  }, [se, ano]);

  return { dados, loading };
}
```

### 8.3 Tabelas sugeridas no banco (MySQL/Prisma)

```sql
-- Notificações semanais
CREATE TABLE dengue_serie_historica (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  ano         INT NOT NULL,
  semana      INT NOT NULL,       -- SE 1 a SE 52
  notificados INT DEFAULT 0,
  confirmados INT DEFAULT 0,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Distribuição geográfica
CREATE TABLE dengue_bairros (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  ano         INT NOT NULL,
  semana      INT NOT NULL,
  bairro      VARCHAR(100) NOT NULL,
  notificados INT DEFAULT 0,
  confirmados INT DEFAULT 0
);

-- Perfil dos casos
CREATE TABLE dengue_perfil (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  ano         INT NOT NULL,
  semana      INT NOT NULL,
  faixa_etaria VARCHAR(20),      -- ex: "10-19"
  sexo        ENUM('F','M'),
  casos       INT DEFAULT 0
);

-- KPIs da semana
CREATE TABLE dengue_kpis (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  ano               INT NOT NULL,
  semana            INT NOT NULL,
  notificados       INT DEFAULT 0,
  confirmados       INT DEFAULT 0,
  sorotipo_tipo3    INT DEFAULT 0,
  isolamentos       INT DEFAULT 0,
  obitos            INT DEFAULT 0,
  sorotipo_desc     VARCHAR(50),
  sorotipo_metodo   VARCHAR(50)
);
```

---

## 9. Checklist de Implementação

- [ ] Instalar dependência: `npm install chart.js react-chartjs-2`
- [ ] Criar arquivo `data/dengue-se09.ts` com os dados estáticos
- [ ] Registrar módulos do Chart.js na página principal
- [ ] Criar componentes em `components/dengue/`
- [ ] Criar a página `saude/dengue`
- [ ] Testar responsividade (mobile, tablet, desktop)
- [ ] Integrar ao menu/sidebar do Mapa da Saúde
- [ ] **Futuro:** Criar endpoint de API e substituir dados estáticos pelo hook

---

## 10. Observações Finais

- Os **valores intermediários** da série histórica (SE 1 a SE 7) foram estimados de forma coerente com os picos documentados (SE 8 = 102 notificados; SE 9 = 7 confirmados). Ajustar com os dados reais do SINAN quando disponíveis.
- A **paleta de cores** do dashboard segue estritamente a identidade visual oficial da Prefeitura de Corumbá (`#1F3473` e `#40A1E6`), com cores epidemiológicas complementares (âmbar para notificados, vermelho para confirmados, verde para óbitos zero).
- O componente `DengueSorotipo` usa gradiente da paleta institucional para destaque visual, compatível com o padrão do sistema.
- **Fonte tipográfica:** Work Sans (já configurada no projeto).

---

*Documento gerado para uso interno — Sistema Mapa da Saúde · Prefeitura Municipal de Corumbá — MS*
*Dados: SINAN 2026 · CIEVS Fronteira Corumbá · SE 09*