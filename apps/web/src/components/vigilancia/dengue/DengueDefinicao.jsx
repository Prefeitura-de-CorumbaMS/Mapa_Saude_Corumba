import { Alert } from 'antd';

export default function DengueDefinicao() {
  const definicao = "Pessoa que viva ou tenha viajado nos últimos 14 dias para área com transmissão de dengue, com febre (2–7 dias) e 2 ou mais sintomas: náuseas, vômitos, exantema, mialgias, cefaleia, dor retroorbital, petéquias ou prova do laço positiva e leucopenia.";

  return (
    <Alert
      message={
        <span style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
          ⚠️ Definição de Caso Suspeito
        </span>
      }
      description={
        <p style={{
          fontSize: '13px',
          lineHeight: '1.6',
          margin: '8px 0 0 0',
        }}>
          {definicao}
        </p>
      }
      type="warning"
      showIcon={false}
      style={{
        backgroundColor: '#FEF3C7',
        border: '1px solid #FCD34D',
        margin: '0 8px 16px 8px',
      }}
    />
  );
}
