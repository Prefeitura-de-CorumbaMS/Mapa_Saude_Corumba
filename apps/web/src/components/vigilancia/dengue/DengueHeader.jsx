import { Card } from 'antd';
import { getPeriodoFormatado } from '../../../utils/calendarioEpidemiologico';

export default function DengueHeader({ data }) {
  if (!data) return null;

  const periodo = getPeriodoFormatado(data.semana_epidemiologica, data.ano);

  return (
    <Card
      style={{
        background: 'linear-gradient(135deg, #1F3473 0%, #2a4a9e 100%)',
        border: 'none',
        marginBottom: '16px',
        margin: '0 8px 16px 8px',
      }}
      styles={{ body: { padding: '16px' } }}
    >
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}>
        <div>
          <p style={{
            color: '#40A1E6',
            fontSize: '11px',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            margin: 0,
          }}>
            CIEVS Fronteira · Corumbá — MS
          </p>
          <h1 style={{
            color: 'white',
            fontSize: '20px',
            fontWeight: 'bold',
            margin: '8px 0 4px 0',
          }}>
            Vigilância de Dengue
          </h1>
          <p style={{
            color: '#a5d6ff',
            fontSize: '12px',
            margin: 0,
          }}>
            Fonte: {data.fonte} · {data.periodo}
          </p>
        </div>
        <div style={{ textAlign: 'left' }}>
          <span style={{
            background: '#40A1E6',
            color: 'white',
            fontSize: '12px',
            fontWeight: 'bold',
            padding: '6px 12px',
            borderRadius: '16px',
            display: 'inline-block',
          }}>
            Boletim · SE {data.semana_epidemiologica.toString().padStart(2, '0')}
          </span>
          {periodo && (
            <p style={{
              color: '#40A1E6',
              fontSize: '11px',
              fontWeight: '600',
              margin: '6px 0 4px 0',
            }}>
              📆 {periodo}
            </p>
          )}
          <p style={{
            color: '#a5d6ff',
            fontSize: '10px',
            margin: '4px 0 0 0',
          }}>
            Secretaria Municipal de Saúde · Prefeitura de Corumbá
          </p>
        </div>
      </div>
    </Card>
  );
}
