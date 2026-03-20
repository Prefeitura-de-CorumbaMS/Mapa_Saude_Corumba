import { Card } from 'antd';

export default function DengueSorotipo({ data }) {
  if (!data) return null;

  const isolamentos = data.kpis.isolamentos_virais;
  const sorotipo = data.kpis.sorotipo_tipo3 > 0 ? 'Dengue Tipo 3' : 'Não identificado';

  return (
    <Card
      style={{
        background: 'linear-gradient(135deg, #1F3473 0%, #40A1E6 100%)',
        border: 'none',
        margin: '0 8px 16px 8px',
      }}
    >
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        flexWrap: 'wrap',
      }}>
        <div>
          <p style={{
            color: '#a5d6ff',
            fontSize: '12px',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            margin: '0 0 4px 0',
          }}>
            🧬 Sorotipo Identificado
          </p>
          <p style={{
            color: 'white',
            fontSize: '24px',
            fontWeight: 'bold',
            margin: 0,
          }}>
            {sorotipo}
          </p>
          <p style={{
            color: '#a5d6ff',
            fontSize: '13px',
            margin: '4px 0 0 0',
          }}>
            Confirmado por RT-qPCR
          </p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{
            color: 'white',
            fontSize: '48px',
            fontWeight: 'bold',
            margin: 0,
            lineHeight: 1,
          }}>
            {isolamentos}
          </p>
          <p style={{
            color: '#a5d6ff',
            fontSize: '13px',
            margin: '8px 0 0 0',
          }}>
            isolamentos virais realizados
          </p>
        </div>
      </div>
    </Card>
  );
}
